const mitigatedResult = [
  {
    'Sensitive Column': 'Gender',
    'Dataset Name': 'german',
    'Method Name': 'Data Repairer',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.81,
    'Statistical Parity Difference': 0.1983695652173913,
    'Equal Opportunity Difference': 0.11813186813186816,
    'Average Odds Difference': 0.12093462093462093,
    'Disparate Impact': 0.546583850931677,
    'Theil Index': -0.055985606944149,
  },
  {
    'Sensitive Column': 'Gender',
    'Dataset Name': 'german',
    'Method Name': 'Relabeller',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.695,
    'Statistical Parity Difference': 1,
    'Equal Opportunity Difference': 1,
    'Average Odds Difference': 1,
    'Disparate Impact': 0,
    'Theil Index': -0.4729135965695591,
  },
  {
    'Sensitive Column': 'Age',
    'Dataset Name': 'german',
    'Method Name': 'Data Repairer',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.8,
    'Statistical Parity Difference': 0.12181545707557268,
    'Equal Opportunity Difference': 0.07954545454545459,
    'Average Odds Difference': 0.033227272727272716,
    'Disparate Impact': 0.6710982658959538,
    'Theil Index': -0.040894690911082776,
  },
  {
    'Sensitive Column': 'Age',
    'Dataset Name': 'german',
    'Method Name': 'Relabeller',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.805,
    'Statistical Parity Difference': 0.11603511025476343,
    'Equal Opportunity Difference': 0.10037878787878796,
    'Average Odds Difference': 0.02281060606060603,
    'Disparate Impact': 0.6867052023121387,
    'Theil Index': -0.03362815056365642,
  },
  {
    'Sensitive Column': 'Gender',
    'Dataset Name': 'adult',
    'Method Name': 'Data Repairer',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.849861802100608,
    'Statistical Parity Difference': 0.17666871956894575,
    'Equal Opportunity Difference': 0.07956043956043957,
    'Average Odds Difference': 0.07401161718914456,
    'Disparate Impact': 0.3212378826205796,
    'Theil Index': -0.09232678425324248,
  },
  {
    'Sensitive Column': 'Gender',
    'Dataset Name': 'adult',
    'Method Name': 'Relabeller',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.803869541182974,
    'Statistical Parity Difference': 0.02099097183289192,
    'Equal Opportunity Difference': 0.344029304029304,
    'Average Odds Difference': 0.20388796800033093,
    'Disparate Impact': 0.8957425153150385,
    'Theil Index': -0.12223907997230488,
  },
  {
    'Sensitive Column': 'Age',
    'Dataset Name': 'adult',
    'Method Name': 'Data Repairer',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.8499723604201216,
    'Statistical Parity Difference': 0.12628503999275104,
    'Equal Opportunity Difference': 0.05572771760448714,
    'Average Odds Difference': 0.05763919878020113,
    'Disparate Impact': 0.5811032819752648,
    'Theil Index': -0.09254608853982471,
  },
  {
    'Sensitive Column': 'Age',
    'Dataset Name': 'adult',
    'Method Name': 'Relabeller',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.7195135433941404,
    'Statistical Parity Difference': 0.8868032894434906,
    'Equal Opportunity Difference': 0.8801133266167381,
    'Average Odds Difference': 0.8748564723647786,
    'Disparate Impact': 0.027936981519628035,
    'Theil Index': -0.07240402971282522,
  },
  {
    'Sensitive Column': 'Race',
    'Dataset Name': 'adult',
    'Method Name': 'Data Repairer',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.8497512437810946,
    'Statistical Parity Difference': 0.08790883614694445,
    'Equal Opportunity Difference': 0.057316587594565926,
    'Average Odds Difference': 0.041502716295148734,
    'Disparate Impact': 0.5900588550521103,
    'Theil Index': -0.09254608853982471,
  },
  {
    'Sensitive Column': 'Race',
    'Dataset Name': 'adult',
    'Method Name': 'Relabeller',
    'Model Name': 'Logistic Regression',
    'Model Accuracy': 0.3648424543946932,
    'Statistical Parity Difference': 0.9086354388987647,
    'Equal Opportunity Difference': 0.647887323943662,
    'Average Odds Difference': 0.8028387410784036,
    'Disparate Impact': 0.08211575981791239,
    'Theil Index': -0.23095747734877636,
  },
];

const analysisResult = [
  {
    datasetName: 'german',
    protectedAttribute: 'Gender',
    privilegedGroup: 'Male',
    unprivilegedGroup: 'Female',
    accuracy: 81,
    metrics: [
      {
        name: 'Statistical Parity Difference (1-m)',
        value: 0.8016304347826086,
      },
      {
        name: 'Equal Opportunity Difference (1-m)',
        value: 0.8818681318681318,
      },
      {
        name: 'Average Odds Difference (1-m)',
        value: 0.8790653790653791,
      },
      {
        name: 'Disparate Impact (m)',
        value: 0.546583850931677,
      },
      {
        name: 'Theil Index (1-m)',
        value: 1.055985606944149,
      },
    ],
  },
  {
    datasetName: 'german',
    protectedAttribute: 'Age',
    privilegedGroup: 'Old',
    unprivilegedGroup: 'Young',
    accuracy: 81,
    metrics: [
      {
        name: 'Statistical Parity Difference (1-m)',
        value: 0.9094412331406552,
      },
      {
        name: 'Equal Opportunity Difference (1-m)',
        value: 0.9204545454545454,
      },
      {
        name: 'Average Odds Difference (1-m)',
        value: 0.9940227272727273,
      },
      {
        name: 'Disparate Impact (m)',
        value: 0.7283236994219653,
        mitigatedValue: 0,
      },
      {
        name: 'Theil Index (1-m)',
        value: 1.055985606944149,
      },
    ],
  },
  {
    datasetName: 'adult',
    protectedAttribute: 'Gender',
    privilegedGroup: 'Male',
    unprivilegedGroup: 'Female',
    accuracy: 84.98618021006081,
    metrics: [
      {
        name: 'Statistical Parity Difference (1-m)',
        value: 0.8230009748984366,
      },
      {
        name: 'Equal Opportunity Difference (1-m)',
        value: 0.9199267399267399,
      },
      {
        name: 'Average Odds Difference (1-m)',
        value: 0.9256101698747863,
      },
      {
        name: 'Disparate Impact (m)',
        value: 0.32083073701523035,
      },
      {
        name: 'Theil Index (1-m)',
        value: 1.091888503970945,
      },
    ],
    methodName: 'Data Repairer',
  },
  {
    datasetName: 'adult',
    protectedAttribute: 'Age',
    privilegedGroup: 'Old',
    unprivilegedGroup: 'Young',
    accuracy: 84.98618021006081,
    metrics: [
      {
        name: 'Statistical Parity Difference (1-m)',
        value: 0.8734698227421482,
      },
      {
        name: 'Equal Opportunity Difference (1-m)',
        value: 0.9427951775210668,
      },
      {
        name: 'Average Odds Difference (1-m)',
        value: 0.9418034738641271,
      },
      {
        name: 'Disparate Impact (m)',
        value: 0.5810200739148701,
      },
      {
        name: 'Theil Index (1-m)',
        value: 1.091888503970945,
      },
    ],
    methodName: 'Relabeller',
    mitigatedAccuracy: 80.5,
  },
  {
    datasetName: 'adult',
    protectedAttribute: 'Race',
    privilegedGroup: 'White',
    unprivilegedGroup: 'Non-white',
    accuracy: 84.98618021006081,
    metrics: [
      {
        name: 'Statistical Parity Difference (1-m)',
        value: 0.9134957239081523,
      },
      {
        name: 'Equal Opportunity Difference (1-m)',
        value: 0.9520730837669363,
      },
      {
        name: 'Average Odds Difference (1-m)',
        value: 0.963103686417792,
      },
      {
        name: 'Disparate Impact (m)',
        value: 0.5968515344810392,
      },
      {
        name: 'Theil Index (1-m)',
        value: 1.091888503970945,
      },
    ],
    methodName: 'Data Repairer',
  },
];

const updatedData = analysisResult.map((section) => {
  const mitigatedForSec = mitigatedResult.filter(
    (mItem) =>
      mItem['Dataset Name'] === section.datasetName &&
      mItem['Sensitive Column'] === section.protectedAttribute
  );
  console.log('section : ', section.datasetName, section.protectedAttribute);
  const manipulatedMitigated = mitigatedForSec.map((item) => {
    const mitigatedVals = [
      {
        name: 'Statistical Parity Difference (1-m)',
        value: 1 - item['Statistical Parity Difference'],
      },
      {
        name: 'Equal Opportunity Difference (1-m)',
        value: 1 - item['Equal Opportunity Difference'],
      },
      {
        name: 'Average Odds Difference (1-m)',
        value: 1 - item['Average Odds Difference'],
      },
      { name: 'Disparate Impact (m)', value: item['Disparate Impact'] },
      { name: 'Theil Index (1-m)', value: 1 - item['Theil Index'] },
    ];

    return {
      ...section,
      methodName: item['Method Name'],
      mitigatedAccuracy: item['Model Accuracy'],
      metrics: JSON.stringify(
        section.metrics.map((metric) => ({
          ...metric,
          mitigatedValue: mitigatedVals.find((mValue) => mValue.name === metric.name)?.value,
        }))
      ),
    };
  });

  console.log('manipulatedMitigated : ', manipulatedMitigated);
});
