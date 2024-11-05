"use client";

import { useState } from "react";
import Image from "next/image";

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
  {title: "Dec 2025 Range Increase", amt: 1.0, maxAmt: "December 2025 Range Increase",},
  {title: "December 2025 10% COLA", amt: 1.1, maxAmt: "December 2025 10% COLA",},
  {title: "Next Anniversary", amt: 1.04, maxAmt: "December 2025 10% COLA",},
  {title: "December 2026 5% COLA", amt: 1.05, maxAmt: "December 2026 5% COLA",}, 
  {title: "Next Anniversary", amt: 1.04, maxAmt: "December 2026 5% COLA",},
  {title: "December 2027 4% COLA", amt: 1.04, maxAmt: "December 2027 4% COLA",}, 
  {title: "Next Anniversary", amt: 1.04, maxAmt: "December 2027 4% COLA",},
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
    if (!selectedStep) return "N/A";

    const foundJob = newSalary.find(job => job.job_title === jobTitle?.job_title);
    const baseSalary = foundJob?.steps.find(step => step.number === selectedStep.number)?.hourly || 0;
    const index = CALCULATED_RATES.findIndex(rate => rate.title === title);
    
    if (index === -1) return "N/A"; // If the title is not found

    // Calculate cumulative multiplier up to the index
    let baseAmount = baseSalary;
    for (let i = 0; i <= index; i++) {
      baseAmount *= CALCULATED_RATES[i].amt;
    }

    let maxAmount = jobTitle ? maxSalary[jobTitle.job_title] : null;
    const maxTitle = CALCULATED_RATES[index]?.maxAmt;
    let salaryCap = maxTitle && maxAmount ? maxAmount[maxTitle] : 0;

    if (title === "December 2025 Range Increase") return salaryCap.toFixed(2);

    const finalAmount = Math.min(salaryCap, baseAmount);

    return finalAmount.toFixed(2); // Return the calculated max amount formatted to two decimal places
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

        <div className="border-2 flex gap-4 items-start p-4">
        {CALCULATED_RATES.map(rate => (
            <div key={`${rate.title}-${rate.maxAmt}`}>
              <div>{rate.title}</div>
              <div>{calculateMax(rate.title)}</div>
            </div>
          ))}
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}