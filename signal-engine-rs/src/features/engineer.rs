use polars::prelude::*;

/// M11: Compute VWAP deviation using a rolling window instead of a global sum.
/// A global sum computes the VWAP across the entire dataset, which is meaningless
/// for live trading. A rolling window (default: 20 bars) gives a localized VWAP
/// that reflects recent market activity.
pub fn compute_vwap_deviation(df: DataFrame, window_size: usize) -> Result<DataFrame, PolarsError> {
    let window = window_size.max(1); // Ensure at least 1

    // In polars 0.33, fixed integer windows use Duration::parse("<N>i")
    let win_str = format!("{}i", window);

    let lf = df.lazy()
        .with_column(
            (col("price") * col("volume")).alias("pv")
        )
        .with_column(
            (col("pv").rolling_sum(RollingOptions {
                window_size: Duration::parse(&win_str),
                min_periods: 1,
                ..Default::default()
            }) / col("volume").rolling_sum(RollingOptions {
                window_size: Duration::parse(&win_str),
                min_periods: 1,
                ..Default::default()
            })).alias("vwap")
        )
        .with_column(
            ((col("price") - col("vwap")) / col("vwap")).alias("vwap_deviation")
        );

    lf.collect()
}
