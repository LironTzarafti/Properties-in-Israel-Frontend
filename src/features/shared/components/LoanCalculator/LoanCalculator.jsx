import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./LoanCalculator.module.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

function LoanCalculator() {
  const { t } = useTranslation();

  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(5); // שנתי %
  const [loanTerm, setLoanTerm] = useState(12); // חודשים
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    calculateLoan();
  }, [loanAmount, interestRate, loanTerm]);

  const calculateLoan = () => {
    const r = interestRate / 100 / 12; // ריבית חודשית
    const n = loanTerm;
    const P = loanAmount;
    const monthly = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
    const total = monthly * n;
    setMonthlyPayment(monthly.toFixed(2));
    setTotalPayment(total.toFixed(2));
    // המלצה בסיסית
    if (monthly / P > 0.1) {
      setRecommendation(t("High monthly payment, consider lowering the amount or extending the term"));
    } else {
      setRecommendation(t("Monthly payment is suitable and feasible"));
    }
  };

  const data = {
    labels: [t("Principal"), t("Interest")],
    datasets: [
      {
        data: [loanAmount, totalPayment - loanAmount],
        backgroundColor: ["#0077cc", "#ffcc00"],
        hoverBackgroundColor: ["#005fa3", "#ffd633"]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: context => `${context.label}: ₪${context.raw.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className={styles.calculatorContainer}>
      <h2>{t("Loan Calculator")}</h2>
      <div className={styles.sliderGroup}>
        <label>{t("Loan Amount")}: {loanAmount.toLocaleString()} ₪</label>
        <input
          type="range"
          min="1000"
          max="1000000"
          step="1000"
          value={loanAmount}
          onChange={(e) => setLoanAmount(Number(e.target.value))}
        />
      </div>
      <div className={styles.sliderGroup}>
        <label>{t("Annual Interest Rate")}: {interestRate}%</label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.1"
          value={interestRate}
          onChange={(e) => setInterestRate(Number(e.target.value))}
        />
      </div>
      <div className={styles.sliderGroup}>
        <label>{t("Loan Term (Months)")}: {loanTerm}</label>
        <input
          type="range"
          min="1"
          max="360"
          step="1"
          value={loanTerm}
          onChange={(e) => setLoanTerm(Number(e.target.value))}
        />
      </div>
      <div className={styles.results}>
        <p>{t("Monthly Payment")}: <strong>{monthlyPayment} ₪</strong></p>
        <p>{t("Total Payment")}: <strong>{totalPayment} ₪</strong></p>
        <p className={styles.recommendation}>{recommendation}</p>
      </div>
      <div className={styles.chart}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}

export default LoanCalculator;







