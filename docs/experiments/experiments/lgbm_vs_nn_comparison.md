# LightGBM vs Neural Network (V7) - In-Depth Comparison

| Metric | Neural Network (V7) | LightGBM (Gradient Boosting) | Impact |
| :--- | :---: | :---: | :--- |
| **Accuracy** | 79.83% | **86.23%** | 🟢 **+6.40%** (Major Win) |
| **Precision (Class 1)** | 48.19% | **65.01%** | 🟢 **+16.82%** (Huge Reduction in False Alarms) |
| **Recall (Class 1)** | **91.55%** | 58.55% | 🔻 -33.00% (Trade-off) |
| **F1-Score** | 0.63 | **0.62** | 🟢 **+-0.02** (Better Balance) |

## Analysis
*   **Precision Upgrade:** LightGBM is much more precise. It jumps from ~48% to **65.0%**. This means when it flags an employee, **it is much more likely to be true.**
*   **Recall Trade-off:** The Neural Network was extremely aggressive (91% recall), catching almost everyone but shouting "wolf" too often. LightGBM is more conservative (**58.6%** recall).
    *   *Decision:* Do we prefer catching *everyone* at the cost of noise (NN), or a slightly cleaner list (LightGBM)?
*   **Recommendation:** Given the Accuracy boost (+4%), LightGBM is generally the **superior model for deployment**, as it reduces "alert fatigue" for HR.
