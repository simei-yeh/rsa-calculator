"use client";

import { useState } from "react";

import current from "./data/currentSalary.json";
import newS from "./data/newSalary.json";
import maxSals from "./data/maxSalary.json";

interface Step {
  number: number; // The step number
  hourly: number; // The hourly wage as a number
}

interface JobTitle {
  job_title: string; // The title of the job
  steps: Step[]; // An array of steps associated with the job
}

interface ColaRates {
  [key: string]: number; // Key is the COLA description, value is the amount
}

interface JobTitleRates {
  [jobTitle: string]: ColaRates; // Key is the job title, value is an object of COLA rates
}

const CALCULATED_RATES = [
  {
    title: "Dec 2025 Range Increase",
    amt: 1.0,
    maxAmt: "December 2025 Range Increase",
  },
  { title: "December 2025 9% COLA", amt: 1.09, maxAmt: "December 2025 9% COLA" },
  {
    title: "Next Anniversary 2025",
    amt: 1.04,
    maxAmt: "December 2025 9% COLA",
  },
  {
    title: "December 2026 5% COLA",
    amt: 1.05,
    maxAmt: "December 2026 5% COLA",
  },
  {
    title: "Next Anniversary 2026",
    amt: 1.04,
    maxAmt: "December 2026 5% COLA",
  },
  {
    title: "December 2027 5% COLA",
    amt: 1.05,
    maxAmt: "December 2027 5% COLA",
  },
  {
    title: "Next Anniversary 2027",
    amt: 1.04,
    maxAmt: "December 2027 5% COLA",
  },
];

export default function Home() {
  const currentSalary: JobTitle[] = current;
  const newSalary: JobTitle[] = newS;
  const maxSalary: JobTitleRates = maxSals;
  const [jobTitle, setJobTitle] = useState<JobTitle | null>(null);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJobTitle =
      currentSalary.find((job) => job.job_title === e.target.value) || null;
    setJobTitle(selectedJobTitle);
    setSelectedStep(null); // Reset selected step when job title changes
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stepNumber = Number(e.target.value);
    const selectedStep =
      jobTitle?.steps.find((step) => step.number === stepNumber) || null;
    setSelectedStep(selectedStep);
  };

  const calculateMax = (title: string) => {
    if (!selectedStep)
      return {
        finalAmount: "N/A",
        percentageIncrease: "N/A",
        cumulativePercentage: "N/A",
      };

    const originalSalary = selectedStep?.hourly;
    const foundJob = newSalary.find(
      (job) => job.job_title === jobTitle?.job_title
    );
    const baseSalary =
      foundJob?.steps.find((step) => step.number === selectedStep.number)
        ?.hourly || 0;
    const index = CALCULATED_RATES.findIndex((rate) => rate.title === title);

    if (index === -1)
      return {
        finalAmount: "N/A",
        percentageIncrease: "N/A",
        cumulativePercentage: "N/A",
      };

    // Calculate cumulative multiplier up to the current index
    let baseAmount = baseSalary;
    let cumulativePercentage = 0;

    for (let i = 0; i <= index; i++) {
      baseAmount *= CALCULATED_RATES[i].amt;
      // console.log("base", baseAmount);
    }

    const maxAmount = jobTitle ? maxSalary[jobTitle.job_title] : null;
    const maxTitle = CALCULATED_RATES[index]?.maxAmt;
    const salaryCap = maxTitle && maxAmount ? maxAmount[maxTitle] : 0;

    const finalAmount = Math.min(salaryCap, baseAmount);

    // Specific handling for "December 2025 Range Increase"
    if (title === "Dec 2025 Range Increase") {
      const percentage = (finalAmount - originalSalary) / originalSalary * 100;
      const percentageString = percentage.toFixed(2);
      return {
        finalAmount: finalAmount.toFixed(2),
        percentageIncrease: percentageString,
        cumulativePercentage: percentageString,
      };
    }

    // Calculate percentage increase between current and previous final amounts
    let percentageIncrease = "N/A";
    if (index > 0) {
      const prevFinalAmount = calculateMax(
        CALCULATED_RATES[index - 1].title
      ).finalAmount; // Calculate for the previous index
      percentageIncrease =
        prevFinalAmount !== "N/A"
          ? (
              ((finalAmount - parseFloat(prevFinalAmount)) /
                parseFloat(prevFinalAmount)) *
              100
            ).toFixed(2)
          : "N/A";
    }

    // Calculate the cumulative percentage increase
    cumulativePercentage =
      ((finalAmount - originalSalary) / originalSalary) * 100;

    return {
      finalAmount: finalAmount.toFixed(2),
      percentageIncrease: percentageIncrease,
      cumulativePercentage: cumulativePercentage.toFixed(2),
    };
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <label htmlFor="job-select" className="font-semibold text-indigo-700">
          First, choose a job title:
        </label>
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

        <label htmlFor="step-select" className="font-semibold text-indigo-700">
          Then, choose a step:
        </label>
        <select
          name="step"
          id="step-select"
          onChange={handleStepChange}
          value={selectedStep ? selectedStep.number : ""}
        >
          <option value="">--Please choose an option--</option>
          {jobTitle &&
            jobTitle.steps.map((step) => (
              <option key={step.number} value={step.number}>
                Step {step.number}: ${step.hourly.toFixed(2)}
              </option>
            ))}
        </select>

        <div className="mt-4">
          <h2 className="text-lg font-bold">Selected Step Details:</h2>
          <p>Step Number: {selectedStep?.number || "Select a step"}</p>
          <p>
            Hourly Wage: {selectedStep && "$" + selectedStep?.hourly.toFixed(2) || "Select a step"}
          </p>
        </div>

       {/* Immediate Table */}
       <div className="mt-8">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Immediate Range Increase</th>
                <th className="border p-2">December 2025 Range Increase</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">
                  New Hourly Rate:
                </td>
                <td className="border p-2">
                  ${calculateMax("Dec 2025 Range Increase").finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("Dec 2025 Range Increase").percentageIncrease}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contract Year 1 Table */}
        <div className="mt-8">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Contract Year 1</th>
                <th className="border p-2">December 2025 9% COLA</th>
                <th className="border p-2">Next Anniversary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">
                  New Hourly Rate:
                </td>
                <td className="border p-2">
                  ${calculateMax("December 2025 9% COLA").finalAmount}
                </td>
                <td className="border p-2">
                  ${calculateMax("Next Anniversary 2025").finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                  Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("December 2025 9% COLA").percentageIncrease}%
                </td>
                <td className="border p-2">
                  {calculateMax("Next Anniversary 2025").percentageIncrease}%
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                  Cumulative Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("December 2025 9% COLA").cumulativePercentage}%
                </td>
                <td className="border p-2">
                  {calculateMax("Next Anniversary 2025").cumulativePercentage}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contract Year 2 Table */}
        <div className="mt-8">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Contract Year 2</th>
                <th className="border p-2">December 2026 5% COLA</th>
                <th className="border p-2">Next Anniversary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">
                  New Hourly Rate:
                </td>
                <td className="border p-2">
                  ${calculateMax("December 2026 5% COLA").finalAmount}
                </td>
                <td className="border p-2">
                  ${calculateMax("Next Anniversary 2026").finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                  Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("December 2026 5% COLA").percentageIncrease}%
                </td>
                <td className="border p-2">
                  {calculateMax("Next Anniversary 2026").percentageIncrease}%
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                  Cumulative Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("December 2026 5% COLA").cumulativePercentage}%
                </td>
                <td className="border p-2">
                  {calculateMax("Next Anniversary 2026").cumulativePercentage}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

         {/* Contract Year 3 Table */}
         <div className="mt-8">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Contract Year 3</th>
                <th className="border p-2">December 2027 5% COLA</th>
                <th className="border p-2">Next Anniversary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">
                  New Hourly Rate:
                </td>
                <td className="border p-2">
                  ${calculateMax("December 2027 5% COLA").finalAmount}
                </td>
                <td className="border p-2">
                  ${calculateMax("Next Anniversary 2027").finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                  Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("December 2027 5% COLA").percentageIncrease}%
                </td>
                <td className="border p-2">
                  {calculateMax("Next Anniversary 2027").percentageIncrease}%
                </td>
              </tr>
              <tr>
                <td className="border p-2">
                  Cumulative Percentage Increase:
                </td>
                <td className="border p-2">
                  {calculateMax("December 2027 5% COLA").cumulativePercentage}%
                </td>
                <td className="border p-2">
                  {calculateMax("Next Anniversary 2027").cumulativePercentage}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  );
}
