(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const index = urlParams.get('id');
    const workpads = JSON.parse(localStorage.getItem('workpads') || '[]');
  
    const pageTitle = document.getElementById('page-title');
    const form = document.getElementById('workpad-form');
  
    // Form inputs
    const processInput = document.getElementById('process');
    const dateInput = document.getElementById('date');
    const locationInput = document.getElementById('location');
    const meetingTimeInput = document.getElementById('meetingTime');
    const detailsInput = document.getElementById('details');
    const storyInput = document.getElementById('story');
  
    const actionsContainer = document.getElementById('actions-container');
    const addActionBtn = document.getElementById('add-action-btn');
  
    let actions = [];
  
    // Render all actions inputs dynamically
    function renderActions() {
      actionsContainer.innerHTML = '';
      actions.forEach((action, idx) => {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-item';
  
        actionDiv.innerHTML = `
          <input type="text" placeholder="Action title" value="${action.title || ''}" class="action-title" data-index="${idx}" />
          <input type="text" placeholder="Action notes" value="${action.notes || ''}" class="action-notes" data-index="${idx}" />
          <button type="button" class="remove-action-btn" data-index="${idx}" aria-label="Remove action">🗑️ Remove</button>
        `;
  
        actionsContainer.appendChild(actionDiv);
      });
  
      // Attach event listeners to inputs and remove buttons
      document.querySelectorAll('.action-title').forEach(input => {
        input.addEventListener('input', (e) => {
          const idx = e.target.dataset.index;
          actions[idx].title = e.target.value;
        });
      });
  
      document.querySelectorAll('.action-notes').forEach(input => {
        input.addEventListener('input', (e) => {
          const idx = e.target.dataset.index;
          actions[idx].notes = e.target.value;
        });
      });
  
      document.querySelectorAll('.remove-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = e.target.dataset.index;
          actions.splice(idx, 1);
          renderActions();
        });
      });
    }
  
    // Add new blank action
    addActionBtn.addEventListener('click', () => {
      actions.push({ title: '', notes: '' });
      renderActions();
    });
  
    // If editing existing workpad, load its data
    if (index !== null && workpads[index]) {
      pageTitle.textContent = 'Edit Workpad';
      const pad = workpads[index];
      processInput.value = pad.process || pad.customerName || '';
      dateInput.value = pad.date || '';
      locationInput.value = pad.location || '';
      meetingTimeInput.value = pad.meetingTime || '';
      actions = Array.isArray(pad.actions) ? pad.actions : [];
      detailsInput.value = pad.details || '';
      storyInput.value = pad.story || '';
    } else {
      pageTitle.textContent = 'New Workpad';
      actions = [];
    }
  
    renderActions();
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const newPad = {
        process: processInput.value.trim(),
        customerName: processInput.value.trim(), // for backward compatibility
        date: dateInput.value,
        location: locationInput.value.trim(),
        meetingTime: meetingTimeInput.value.trim(),
        actions: actions,
        details: detailsInput.value.trim(),
        story: storyInput.value.trim(),
      };
  
      if (index !== null && workpads[index]) {
        workpads[index] = newPad;
      } else {
        workpads.push(newPad);
      }
  
      localStorage.setItem('workpads', JSON.stringify(workpads));
  
      // Redirect to the listing page after save
      window.location.href = '/index.html'; // Changed from /babb/plainjane/workpads
    });
  
    document.getElementById('cancel-btn').addEventListener('click', () => {
      window.location.href = '/index.html'; // Changed from /babb/plainjane/workpads
    });
  })();