'use strict';

const planningConfig = Object.freeze({
  label: 'PLANNING SCENARIO — NOT A FORECAST OR GUARANTEE',
  entryPriceEUR: 30,
  targetAverageSpendEUR: { min: 55, max: 60, scenario: 55 },
  targetGuestsPerDay: 15,
  targetOperatingDaysPerMonth: 26
});

const calculatePlanningScenario = (config = planningConfig) => {
  const dailyRevenueEUR = config.targetGuestsPerDay * config.targetAverageSpendEUR.scenario;
  return { dailyRevenueEUR, monthlyGrossRevenueEUR: dailyRevenueEUR * config.targetOperatingDaysPerMonth, isProfit: false };
};

if (typeof module !== 'undefined') module.exports = { planningConfig, calculatePlanningScenario };
