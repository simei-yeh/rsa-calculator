"use client";

import { useState } from "react";

import current from "./data/currentSalary.json";
import newS from "./data/currentSalary.json";
import maxSals from "./data/maxSalary.json";

interface Step {
  number: number; // The step number
  hourly: number; // The hourly wage as a number
}

interface JobTitle {
  job_title: string; // The title of the job
  steps: Step[];     // An array of steps associated with the job
}

interface ColaRates {
  [key: string]: number; // Key is the COLA description, value is the amount
}

interface JobTitleRates {
  [jobTitle: string]: ColaRates; // Key is the job title, value is an object of COLA rates
}

const CALCULATED_RATES = [
  {title: "Dec 2025 Range Increase", amt: 1.0, maxAmt: "December 2025 Range Increase", },
  {title: "December 2025 10% COLA", amt: 1.1, maxAmt: "December 2025 10% COLA",},
  {title: "Next Anniversary 2025", amt: 1.04, maxAmt: "December 2025 10% COLA",},
  {title: "December 2026 5% COLA", amt: 1.05, maxAmt: "December 2026 5% COLA",},
  {title: "Next Anniversary 2026", amt: 1.04, maxAmt: "December 2026 5% COLA",},
  {title: "December 2027 4% COLA", amt: 1.04, maxAmt: "December 2027 4% COLA",},
  {title: "Next Anniversary 2027", amt: 1.04, maxAmt: "December 2027 4% COLA",},
];

export default function Home() {
  const currentSalary: JobTitle[] = current;
  const newSalary: JobTitle[] = newS;
  const maxSalary: JobTitleRates = maxSals;
  const [jobTitle, setJobTitle] = useState<JobTitle | null>(null);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJobTitle = currentSalary.find(job => job.job_title === e.target.value) || null;
    setJobTitle(selectedJobTitle);
    setSelectedStep(null); // Reset selected step when job title changes
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stepNumber = Number(e.target.value);
    const selectedStep = jobTitle?.steps.find(step => step.number === stepNumber) || null;
    setSelectedStep(selectedStep);
  };

  const calculateMax = (title: string) => {
    if (!selectedStep) return {
      finalAmount: "N/A",
      percentageIncrease: "N/A",
      cumulativePercentage: "N/A"
    };

    const originalSalary = selectedStep?.hourly;
    const foundJob = newSalary.find(job => job.job_title === jobTitle?.job_title);
    const baseSalary = foundJob?.steps.find(step => step.number === selectedStep.number)?.hourly || 0;
    const index = CALCULATED_RATES.findIndex(rate => rate.title === title);

    if (index === -1) return {
      finalAmount: "N/A",
      percentageIncrease: "N/A",
      cumulativePercentage: "N/A"
    };

    // Calculate cumulative multiplier up to the current index
    let baseAmount = baseSalary;
    let cumulativePercentage = 0;

    for (let i = 0; i <= index; i++) {
      baseAmount *= CALCULATED_RATES[i].amt;
      console.log('base', baseAmount); // Log the base amount to see how it's changing
    }

    const maxAmount = jobTitle ? maxSalary[jobTitle.job_title] : null;
    const maxTitle = CALCULATED_RATES[index]?.maxAmt;
    const salaryCap = maxTitle && maxAmount ? maxAmount[maxTitle] : 0;

    // Specific handling for "December 2025 Range Increase"
    if (title === "December 2025 Range Increase") {
      return {
        finalAmount: salaryCap.toFixed(2),
        percentageIncrease: "N/A", // Adjusting the increase for this specific case
        cumulativePercentage: "N/A"
      };
    }

    const finalAmount = Math.min(salaryCap, baseAmount);

    // Calculate percentage increase between current and previous final amounts
    let percentageIncrease = "N/A";
    if (index > 0) {
      const prevFinalAmount = calculateMax(CALCULATED_RATES[index - 1].title).finalAmount; // Calculate for the previous index
      percentageIncrease = prevFinalAmount !== "N/A" ? ((finalAmount - parseFloat(prevFinalAmount)) / parseFloat(prevFinalAmount) * 100).toFixed(2) : "N/A";
    }

    // Calculate the cumulative percentage increase
    cumulativePercentage = ((finalAmount - originalSalary) / originalSalary) * 100;

    return {
      finalAmount: finalAmount.toFixed(2),
      percentageIncrease: percentageIncrease,
      cumulativePercentage: cumulativePercentage.toFixed(2)
    };
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <label htmlFor="job-select" className="font-semibold text-indigo-700">First, choose a job title:</label>
        <select
          name="job-title"
          id="job-title"
          onChange={handleJobTitleChange}
          value={jobTitle ? jobTitle.job_title : ""}
        >
          <option value="">--Please choose an option--</option>
          {currentSalary.map((job) => (
            <option key={job.job_title} value={job.job_title}>
              {job.job_title}
            </option>
          ))}
        </select>

        <label htmlFor="step-select" className="font-semibold text-indigo-700">Then, choose a step:</label>
        <select
          name="step"
          id="step-select"
          onChange={handleStepChange}
          value={selectedStep ? selectedStep.number : ""}
        >
          <option value="">--Please choose an option--</option>
          {jobTitle && jobTitle.steps.map((step) => (
            <option key={step.number} value={step.number}>
              Step {step.number}: ${step.hourly.toFixed(2)}
            </option>
          ))}
        </select>

        {selectedStep && (
          <div className="mt-4">
            <h2 className="text-lg font-bold">Selected Step Details:</h2>
            <p>Step Number: {selectedStep.number}</p>
            <p>Hourly Wage: ${selectedStep.hourly.toFixed(2)}</p>
          </div>
        )}

<div className="grid grid-cols-7">
  {CALCULATED_RATES.map((rate) => {
    const { finalAmount, percentageIncrease, cumulativePercentage } = calculateMax(rate.title);
    return (
      <div key={`${rate.title}-${rate.maxAmt}`} className="p-4 border text-center">
        <div className="border-b-2 pb-2 mb-2 h-1/3">{rate.title}</div>
        <div className="grid-rows-4">
        <div><span className="font-semibold">Final Amount:</span> ${finalAmount}</div>
        <div><span className="font-semibold">%age Increase:</span> {percentageIncrease}%</div>
        <div><span className="font-semibold">Cumulative %age Increase</span> {cumulativePercentage}%</div>
        </div>
      </div>
    );
  })}
</div>

      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
