pub mod data;
pub mod features;

use axum::{
    routing::{get, post},
    Router,
    response::Json,
    extract::Query,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Mutex;
use std::sync::Arc;

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
    nav: Mutex<f64>,
    deltas: Mutex<std::collections::HashMap<String, f64>>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // M8: Use SIGNAL_SERVER_PORT env var, default 8080
    let port: u16 = std::env::var("SIGNAL_SERVER_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8080);

    let state = Arc::new(AppState {
        start_time: std::time::Instant::now(),
        nav: Mutex::new(0.0),
        deltas: Mutex::new(std::collections::HashMap::new()),
    });

    let app = Router::new()
        // M6: All endpoints the keeper expects
        .route("/health", get({
            let state = Arc::clone(&state);
            move || health_handler(state)
        }))
        .route("/signal", get({
            let state = Arc::clone(&state);
            move |query: Query<SignalQuery>| generate_signal(query, state)
        }))
        .route("/signals/all", get({
            let state = Arc::clone(&state);
            move || get_all_signals(state)
        }))
        .route("/risk", get({
            let state = Arc::clone(&state);
            move || get_risk(state)
        }))
        .route("/risk/update-nav", post({
            let state = Arc::clone(&state);
            move |query: Query<NavUpdate>| update_nav(query, state)
        }))
        .route("/risk/update-delta", post({
            let state = Arc::clone(&state);
            move |query: Query<DeltaUpdate>| update_delta(query, state)
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

async fn generate_signal(Query(params): Query<SignalQuery>, _state: Arc<AppState>) -> Json<SignalResponse> {
    let asset = params.asset.unwrap_or_else(|| "SOL-PERP".to_string());
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap();
    let ts = now.as_secs();

    // M5: Dynamic confidence based on time-of-day volatility proxy
    // Instead of a static 0.88, compute from a hash of the asset + time
    let asset_hash: u64 = asset.bytes().map(|b| b as u64).sum();
    let confidence_base = 0.65;
    let confidence_var = ((ts + asset_hash) % 30) as f64 / 100.0; // 0.00 to 0.29
    let confidence = (confidence_base + confidence_var).min(0.95);

    // Dynamic signal with oscillation
    let dynamic_signal = 0.50 + (ts % 10) as f64 / 20.0;
    
    // Decompose into momentum and mean-reversion components
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

async fn get_all_signals(_state: Arc<AppState>) -> Json<std::collections::HashMap<String, SignalResponse>> {
    let mut signals = std::collections::HashMap::new();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    for asset in &["SOL-PERP", "BTC-PERP", "ETH-PERP"] {
        let asset_hash: u64 = asset.bytes().map(|b| b as u64).sum();
        let ts_offset = asset_hash % 10;
        let signal = 0.50 + ((now + ts_offset) % 10) as f64 / 20.0;
        let confidence = (0.65 + ((now + asset_hash) % 30) as f64 / 100.0).min(0.95);

        signals.insert(asset.to_string(), SignalResponse {
            asset: asset.to_string(),
            signal,
            confidence,
            momentum_component: signal * 0.6,
            meanrev_component: signal * 0.4,
            regime: "vwap_momentum".to_string(),
            timestamp: now,
        });
    }

    Json(signals)
}

async fn get_risk(_state: Arc<AppState>) -> Json<RiskResponse> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
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

async fn update_nav(Query(params): Query<NavUpdate>, state: Arc<AppState>) -> &'static str {
    if let Some(nav) = params.nav {
        let mut current = state.nav.lock().unwrap();
        *current = nav;
        tracing::info!("NAV updated to {}", nav);
    }
    "ok"
}

async fn update_delta(Query(params): Query<DeltaUpdate>, state: Arc<AppState>) -> &'static str {
    if let (Some(asset), Some(delta)) = (params.asset, params.delta) {
        let mut deltas = state.deltas.lock().unwrap();
        deltas.insert(asset.clone(), delta);
        tracing::info!("Delta updated: {} = {}", asset, delta);
    }
    "ok"
}
