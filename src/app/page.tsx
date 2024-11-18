"use client";

import Image from "next/image";
import AdvancedLogo from "./assets/advanced-horizontal.png";
import RSALogo from "./assets/rsa.jpg";

import React, { useEffect, useState } from "react";

import current from "./data/currentSalary.json";
import newS from "./data/newSalary.json";
import maxSals from "./data/maxSalary.json";

interface JobTitle {
  job_title: string; // The title of the job
  min: number;
  max: number;
}

interface ColaRates {
  job_title: string;
  [key: string]: number | string;
}

enum SalaryEvent {
  DEC_2024_RANGE_INCREASE = "December 2024 Range Increase",
  DEC_2024_9PERCENT_COLA = "December 2024 9% COLA",
  NEXT_ANNIVERSARY_2024 = "Next Anniversary 2024",
  DEC_2025_5PERCENT_COLA = "December 2025 5% COLA",
  NEXT_ANNIVERSARY_2025 = "Next Anniversary 2025",
  DEC_2026_5PERCENT_COLA = "December 2026 5% COLA",
  NEXT_ANNIVERSARY_2026 = "Next Anniversary 2026",
}

const CALCULATED_RATES = [
  {
    title: SalaryEvent.DEC_2024_RANGE_INCREASE,
    amt: 1.0,
    maxAmt: SalaryEvent.DEC_2024_RANGE_INCREASE,
  },
  {
    title: SalaryEvent.DEC_2024_9PERCENT_COLA,
    amt: 1.09,
    maxAmt: SalaryEvent.DEC_2024_9PERCENT_COLA,
  },
  {
    title: SalaryEvent.NEXT_ANNIVERSARY_2024,
    amt: 1.04,
    maxAmt: SalaryEvent.DEC_2024_9PERCENT_COLA,
  },
  {
    title: SalaryEvent.DEC_2025_5PERCENT_COLA,
    amt: 1.05,
    maxAmt: SalaryEvent.DEC_2025_5PERCENT_COLA,
  },
  {
    title: SalaryEvent.NEXT_ANNIVERSARY_2025,
    amt: 1.04,
    maxAmt: SalaryEvent.DEC_2025_5PERCENT_COLA,
  },
  {
    title: SalaryEvent.DEC_2026_5PERCENT_COLA,
    amt: 1.05,
    maxAmt: SalaryEvent.DEC_2026_5PERCENT_COLA,
  },
  {
    title: SalaryEvent.NEXT_ANNIVERSARY_2026,
    amt: 1.04,
    maxAmt: SalaryEvent.DEC_2026_5PERCENT_COLA,
  },
];

export default function Home() {
  const currentSalary: JobTitle[] = current;
  const newSalary: JobTitle[] = newS;
  const maxSalary: ColaRates[] = maxSals;
  const [jobTitle, setJobTitle] = useState<JobTitle | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [inputSalary, setInputSalary] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJobTitle =
      currentSalary.find((job) => job.job_title === e.target.value) || null;
    setJobTitle(selectedJobTitle);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setInputSalary(value);

    // Validation logic
    if (value === null || value === 0) {
      setErrorMessage("Please enter a value");
    } else if (value < (minAmount || 30)) {
      setErrorMessage(
        `Salary must be at least $${
          minAmount || 30
        }. We've used the min amount known for this job title.`
      );
    } else if (value > (maxAmount || 80)) {
      setErrorMessage(
        `Salary must not exceed $${
          maxAmount || 80
        }. We've used the max amount known for this job title.`
      );
    } else {
      setErrorMessage("");
    }
  };

  useEffect(() => {
    if (!jobTitle) {
      setMinAmount(null);
      setMaxAmount(null);
    }

    setMinAmount(jobTitle?.min || null);
    setMaxAmount(jobTitle?.max || null);
  }, [jobTitle]);

  const calculateMax = (title: string) => {
    if (!inputSalary)
      return {
        finalAmount: "N/A",
        percentageIncrease: "N/A",
        cumulativePercentage: "N/A",
      };

    const originalSalary = inputSalary;
    const foundJob = newSalary.find(
      (job) => job.job_title === jobTitle?.job_title
    );
    const foundMaxJob = maxSalary.find(
      (job) => job.job_title === jobTitle?.job_title
    );

    const baseSalary =
      foundJob && Math.min(Math.max(foundJob.min, inputSalary), foundJob.max);
    const index = CALCULATED_RATES.findIndex((rate) => rate.title === title);

    if (!baseSalary || index === -1 || !foundMaxJob || !foundJob)
      return {
        finalAmount: "N/A",
        percentageIncrease: "N/A",
        cumulativePercentage: "N/A",
      };

    // Calculate cumulative multiplier up to the current index
    let baseAmount = baseSalary;
    let cumulativePercentage = 0;

    // Apply all previous salary increases to the base salary
    for (let i = 0; i <= index; i++) {
      baseAmount *= CALCULATED_RATES[i].amt;
    }

    // Apply salary cap after calculating the final base amount
    const maxTitle = CALCULATED_RATES[index].maxAmt;
    const salaryCap = foundMaxJob[maxTitle];
    let finalAmount = baseAmount;

    if (typeof salaryCap === "number") {
      finalAmount = Math.min(salaryCap, baseAmount);
    }

    // Calculate percentage increase based on the capped final amount
    let percentageIncrease = (
      ((finalAmount - originalSalary) / originalSalary) *
      100
    );

    // Tolerance threshold for rounding (±0.02%)
    const tolerance = 0.03;
    const roundedPercentage = Math.round(percentageIncrease * 100) / 100; // Round to 2 decimal places

    // Check if percentageIncrease is within tolerance to a whole number (like 4.00 or 5.00)
    const isCloseToWhole = (value: number) => {
      return Math.abs(value - Math.round(value)) <= tolerance;
    };

    // Adjust percentage increase to the exact whole number if it's within tolerance
    if (isCloseToWhole(roundedPercentage)) {
      percentageIncrease = Math.round(roundedPercentage);
    } else {
      percentageIncrease = roundedPercentage;
    }

    // Calculate cumulative percentage increase
    cumulativePercentage =
      ((finalAmount - originalSalary) / originalSalary) * 100;

    // If it's the DEC_2024_RANGE_INCREASE event, calculate percentages accordingly
    if (title === SalaryEvent.DEC_2024_RANGE_INCREASE) {
      return {
        finalAmount: finalAmount.toFixed(2),
        percentageIncrease: percentageIncrease,
        cumulativePercentage: percentageIncrease,
      };
    }

    // Calculate the percentage increase between current and previous final amounts
    let prevFinalAmount = "N/A";
    let previousPercentageIncrease = "N/A";
    if (index > 0) {
      prevFinalAmount = calculateMax(CALCULATED_RATES[index - 1].title).finalAmount;
      if (prevFinalAmount !== "N/A") {
        let previousIncrease = (finalAmount - parseFloat(prevFinalAmount)) /
        parseFloat(prevFinalAmount) *
        100;
        if (isCloseToWhole(previousIncrease)) {
          previousIncrease = Math.round(previousIncrease);
        } else {
          previousIncrease = previousIncrease;
        }

        previousPercentageIncrease = (
          previousIncrease
        ).toFixed(2);
      }
    }

    return {
      finalAmount: finalAmount.toFixed(2),
      percentageIncrease: previousPercentageIncrease,
      cumulativePercentage: cumulativePercentage.toFixed(2),
    };
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {/* <-- Logos --> */}
        <div className="w-full flex justify-between">
          <div className="p-6 w-1/2 flex justify-center">
            <Image
              alt="advanced consulting logo"
              src={AdvancedLogo}
              width={200}
              height={200}
            />
          </div>
          <div className="p-6 w-1/2 flex justify-center">
            <Image
              alt="riverside sheriffs logo"
              src={RSALogo}
              width={200}
              height={200}
            />
          </div>
        </div>

        <label htmlFor="job-select" className="font-semibold text-indigo-700">
          First, choose a job title:
        </label>
        <select
          name="job-title"
          id="job-title"
          className="shadow border py-2 px-3 rounded"
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

        <label htmlFor="salary-input" className="font-semibold text-indigo-700">
          Then, enter your current hourly rate (min {`$${minAmount || "N/A"}`} -
          max {`$${maxAmount || "N/A"}`})
        </label>
        <input
          name="salary"
          id="salary-input"
          type="number"
          min={minAmount || 30} // Minimum value for the salary input
          max={maxAmount || 80} // Maximum value for the salary input
          className="shadow border py-2 px-3 rounded w-1/2"
          onChange={handleChange}
        />
        {errorMessage && (
          <span className="text-red-500 bold">{errorMessage}</span>
        )}

        {/* Immediate Table */}
        <div className="mt-8">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Immediate Range Increase</th>
                <th className="border p-2">December 2024 Range Increase</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">New Hourly Rate:</td>
                <td className="border p-2">
                  $
                  {
                    calculateMax(SalaryEvent.DEC_2024_RANGE_INCREASE)
                      .finalAmount
                  }
                </td>
              </tr>
              <tr>
                <td className="border p-2">Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2024_RANGE_INCREASE)
                      .percentageIncrease
                  }
                  %
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
                <th className="border p-2">December 2024 9% COLA</th>
                <th className="border p-2">Next Anniversary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">New Hourly Rate:</td>
                <td className="border p-2">
                  $
                  {calculateMax(SalaryEvent.DEC_2024_9PERCENT_COLA).finalAmount}
                </td>
                <td className="border p-2">
                  ${calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2024).finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2024_9PERCENT_COLA)
                      .percentageIncrease
                  }
                  %
                </td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2024)
                      .percentageIncrease
                  }
                  %
                </td>
              </tr>
              <tr>
                <td className="border p-2">Cumulative Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2024_9PERCENT_COLA)
                      .cumulativePercentage
                  }
                  %
                </td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2024)
                      .cumulativePercentage
                  }
                  %
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
                <th className="border p-2">December 2025 5% COLA</th>
                <th className="border p-2">Next Anniversary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">New Hourly Rate:</td>
                <td className="border p-2">
                  $
                  {calculateMax(SalaryEvent.DEC_2025_5PERCENT_COLA).finalAmount}
                </td>
                <td className="border p-2">
                  ${calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2025).finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2025_5PERCENT_COLA)
                      .percentageIncrease
                  }
                  %
                </td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2025)
                      .percentageIncrease
                  }
                  %
                </td>
              </tr>
              <tr>
                <td className="border p-2">Cumulative Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2025_5PERCENT_COLA)
                      .cumulativePercentage
                  }
                  %
                </td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2025)
                      .cumulativePercentage
                  }
                  %
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
                <th className="border p-2">December 2026 5% COLA</th>
                <th className="border p-2">Next Anniversary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">New Hourly Rate:</td>
                <td className="border p-2">
                  $
                  {calculateMax(SalaryEvent.DEC_2026_5PERCENT_COLA).finalAmount}
                </td>
                <td className="border p-2">
                  ${calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2026).finalAmount}
                </td>
              </tr>
              <tr>
                <td className="border p-2">Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2026_5PERCENT_COLA)
                      .percentageIncrease
                  }
                  %
                </td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2026)
                      .percentageIncrease
                  }
                  %
                </td>
              </tr>
              <tr>
                <td className="border p-2">Cumulative Percentage Increase:</td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.DEC_2026_5PERCENT_COLA)
                      .cumulativePercentage
                  }
                  %
                </td>
                <td className="border p-2">
                  {
                    calculateMax(SalaryEvent.NEXT_ANNIVERSARY_2026)
                      .cumulativePercentage
                  }
                  %
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
