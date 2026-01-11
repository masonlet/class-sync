function extractCommandInputs(interaction) {
  return {
    courseInput: interaction.options.getString('course'),
    cohort: interaction.options.getRole('cohort'),
    assignment: interaction.options.getString('assignment'),
    dateInput: interaction.options.getString('date')
  };
}

function validateChannelResolution(channel) {
  if (!channel)
    return { valid: false, error: 'Channel not found.' };

  if (channel === "DUPLICATE") 
    return { valid: false, error: 'Multiple channels found.' };

  return { valid: true };
}

function validateChannelFilter(channel) {
  if (channel === "DUPLICATE")
    return { valid: false, error: 'Multiple channels match your filter. Please be more specific.' };
  
  return { valid: true };
}

function findDeadline(deadlines, channel, cohort, assignment) {
  if (!channel || !cohort) return undefined;

  return deadlines.find(d => d &&
    d.courseChannelId === channel.id &&
    d.cohortId === cohort.id &&
    d.assignment === assignment
  );
}

module.exports = { 
  extractCommandInputs, 
  validateChannelResolution,
  validateChannelFilter,
  findDeadline 
};
