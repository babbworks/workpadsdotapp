async function loadWorkpads(page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    const workpads = await db.workpads.offset(offset).limit(pageSize).toArray();
    renderWorkpads(workpads);
  } catch (error) {
    console.error('Error loading workpads:', error);
    alert('Failed to load workpads. Please try again later.');
  }
}