export function copyQuestionsText(selections) {
  return selections.competencies
    .map((c) => {
      const lines = [...c.questions, ...c.customQuestions].map((q) => `- ${q}`);
      return [`${c.name} (${c.panelist})`, ...lines].join('\n');
    })
    .join('\n\n');
}
