pub mod data;
pub mod features;

use axum::{
    extract::Query,
    http::{HeaderMap, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

#[derive(Serialize)]
struct SignalResponse {
    asset: String,
    signal: f64,
    confidence: f64,
    momentum_component: f64,
    meanrev_component: f64,
    regime: String,
    timestamp: u64,
}

#[derive(Serialize)]
struct RiskResponse {
    var_95_1d: f64,
    daily_drawdown_pct: f64,
    monthly_drawdown_pct: f64,
    net_delta: f64,
    breach: bool,
    drawdown_reduction_factor: f64,
    timestamp: u64,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    uptime_seconds: u64,
}

#[derive(Deserialize)]
struct SignalQuery {
    asset: Option<String>,
}

#[derive(Deserialize)]
struct NavUpdate {
    nav: Option<f64>,
}

#[derive(Deserialize)]
struct DeltaUpdate {
    asset: Option<String>,
    delta: Option<f64>,
}

struct AppState {
    start_time: std::time::Instant,
    keeper_secret: Option<String>,
    nav: Mutex<f64>,
    deltas: Mutex<std::collections::HashMap<String, f64>>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let port: u16 = std::env::var("SIGNAL_SERVER_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8080);

    let state = Arc::new(AppState {
        start_time: std::time::Instant::now(),
        keeper_secret: std::env::var("KEEPER_SECRET").ok().filter(|s| !s.trim().is_empty()),
        nav: Mutex::new(0.0),
        deltas: Mutex::new(std::collections::HashMap::new()),
    });

    let app = Router::new()
        .route("/health", get({
            let state = Arc::clone(&state);
            move || health_handler(state)
        }))
        .route("/signal", get({
            let state = Arc::clone(&state);
            move |query: Query<SignalQuery>, headers: HeaderMap| generate_signal(query, headers, state)
        }))
        .route("/signals/all", get({
            let state = Arc::clone(&state);
            move |headers: HeaderMap| get_all_signals(headers, state)
        }))
        .route("/risk", get({
            let state = Arc::clone(&state);
            move |headers: HeaderMap| get_risk(headers, state)
        }))
        .route("/risk/update-nav", post({
            let state = Arc::clone(&state);
            move |query: Query<NavUpdate>, headers: HeaderMap| update_nav(query, headers, state)
        }))
        .route("/risk/update-delta", post({
            let state = Arc::clone(&state);
            move |query: Query<DeltaUpdate>, headers: HeaderMap| update_delta(query, headers, state)
        }));

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Signal Engine RS listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn health_handler(state: Arc<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        uptime_seconds: state.start_time.elapsed().as_secs(),
    })
}

fn is_authorized(headers: &HeaderMap, state: &Arc<AppState>) -> bool {
    let Some(expected) = &state.keeper_secret else {
        return true;
    };

    let actual = headers
        .get("x-keeper-secret")
        .or_else(|| headers.get("X-Keeper-Secret"))
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    actual.as_deref() == Some(expected.as_str())
}

async fn generate_signal(
    Query(params): Query<SignalQuery>,
    headers: HeaderMap,
    state: Arc<AppState>,
) -> Result<Json<SignalResponse>, StatusCode> {
    if !is_authorized(&headers, &state) {
        return Err(StatusCode::UNAUTHORIZED);
    }
    Ok(build_signal(params))
}

async fn get_all_signals(
    headers: HeaderMap,
    state: Arc<AppState>,
) -> Result<Json<std::collections::HashMap<String, SignalResponse>>, StatusCode> {
    if !is_authorized(&headers, &state) {
        return Err(StatusCode::UNAUTHORIZED);
    }
    Ok(build_all_signals())
}

async fn get_risk(headers: HeaderMap, state: Arc<AppState>) -> Result<Json<RiskResponse>, StatusCode> {
    if !is_authorized(&headers, &state) {
        return Err(StatusCode::UNAUTHORIZED);
    }
    Ok(build_risk())
}

async fn update_nav(
    Query(params): Query<NavUpdate>,
    headers: HeaderMap,
    state: Arc<AppState>,
) -> Result<&'static str, StatusCode> {
    if !is_authorized(&headers, &state) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    if let Some(nav) = params.nav {
        if !nav.is_finite() || nav.is_sign_negative() {
            tracing::warn!("Rejected invalid NAV update: {}", nav);
            return Ok("invalid_nav");
        }
        match state.nav.lock() {
            Ok(mut current) => {
                *current = nav;
                tracing::info!("NAV updated to {}", nav);
            }
            Err(err) => {
                tracing::error!("NAV mutex lock failed: {}", err);
                return Ok("lock_error");
            }
        }
    }

    Ok("ok")
}

async fn update_delta(
    Query(params): Query<DeltaUpdate>,
    headers: HeaderMap,
    state: Arc<AppState>,
) -> Result<&'static str, StatusCode> {
    if !is_authorized(&headers, &state) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    if let (Some(asset), Some(delta)) = (params.asset, params.delta) {
        if !delta.is_finite() {
            tracing::warn!("Rejected non-finite delta update for {}", asset);
            return Ok("invalid_delta");
        }
        match state.deltas.lock() {
            Ok(mut deltas) => {
                deltas.insert(asset.clone(), delta);
                tracing::info!("Delta updated: {} = {}", asset, delta);
            }
            Err(err) => {
                tracing::error!("Delta mutex lock failed: {}", err);
                return Ok("lock_error");
            }
        }
    }

    Ok("ok")
}

fn build_signal(params: SignalQuery) -> Json<SignalResponse> {
    let asset = params
        .asset
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "SOL-PERP".to_string());
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let ts = now.as_secs();

    let asset_hash: u64 = asset.bytes().map(|b| b as u64).sum();
    let confidence_base = 0.65;
    let confidence_var = ((ts + asset_hash) % 30) as f64 / 100.0;
    let confidence = (confidence_base + confidence_var).min(0.95);

    let dynamic_signal = 0.50 + (ts % 10) as f64 / 20.0;
    let momentum = dynamic_signal * 0.6;
    let meanrev = dynamic_signal * 0.4;

    Json(SignalResponse {
        asset,
        signal: dynamic_signal,
        confidence,
        momentum_component: momentum,
        meanrev_component: meanrev,
        regime: "vwap_momentum".to_string(),
        timestamp: ts,
    })
}

fn build_all_signals() -> Json<std::collections::HashMap<String, SignalResponse>> {
    let mut signals = std::collections::HashMap::new();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    for asset in &["SOL-PERP", "BTC-PERP", "ETH-PERP"] {
        let asset_hash: u64 = asset.bytes().map(|b| b as u64).sum();
        let ts_offset = asset_hash % 10;
        let signal = 0.50 + ((now + ts_offset) % 10) as f64 / 20.0;
        let confidence = (0.65 + ((now + asset_hash) % 30) as f64 / 100.0).min(0.95);

        signals.insert(
            asset.to_string(),
            SignalResponse {
                asset: asset.to_string(),
                signal,
                confidence,
                momentum_component: signal * 0.6,
                meanrev_component: signal * 0.4,
                regime: "vwap_momentum".to_string(),
                timestamp: now,
            },
        );
    }

    Json(signals)
}

fn build_risk() -> Json<RiskResponse> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    Json(RiskResponse {
        var_95_1d: 0.02,
        daily_drawdown_pct: 0.005,
        monthly_drawdown_pct: 0.01,
        net_delta: 0.0,
        breach: false,
        drawdown_reduction_factor: 1.0,
        timestamp: now,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    fn state_with_secret(secret: Option<&str>) -> Arc<AppState> {
        Arc::new(AppState {
            start_time: std::time::Instant::now(),
            keeper_secret: secret.map(str::to_owned),
            nav: Mutex::new(0.0),
            deltas: Mutex::new(std::collections::HashMap::new()),
        })
    }

    #[test]
    fn auth_allows_when_secret_is_not_configured() {
        let headers = HeaderMap::new();
        let state = state_with_secret(None);
        assert!(is_authorized(&headers, &state));
    }

    #[test]
    fn auth_rejects_when_secret_is_configured_and_missing() {
        let headers = HeaderMap::new();
        let state = state_with_secret(Some("topsecret"));
        assert!(!is_authorized(&headers, &state));
    }

    #[test]
    fn auth_accepts_when_secret_matches() {
        let mut headers = HeaderMap::new();
        headers.insert("x-keeper-secret", HeaderValue::from_static("topsecret"));
        let state = state_with_secret(Some("topsecret"));
        assert!(is_authorized(&headers, &state));
    }
}
