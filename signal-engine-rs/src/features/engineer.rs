use polars::prelude::*;

pub fn compute_vwap_deviation(df: DataFrame) -> Result<DataFrame, PolarsError> {
    // Equivalent of pandas vwap computing utilizing lazyframes
    let lf = df.lazy()
        .with_column(
            ((col("price") * col("volume")).sum() / col("volume").sum()).alias("vwap")
        )
        .with_column(
            ((col("price") - col("vwap")) / col("vwap")).alias("vwap_deviation")
        );
        
    lf.collect()
}
