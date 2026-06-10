// Function to display a custom message box instead of alert()
function showMessageBox(message) {
  const overlay = document.getElementById('message-overlay');
  const messageText = document.getElementById('message-text');
  const okButton = document.getElementById('message-ok-btn');

  messageText.textContent = message;
  overlay.classList.remove('hidden');

  return new Promise(resolve => {
    okButton.onclick = () => {
      overlay.classList.add('hidden');
      resolve();
    };
  });
}

// LocalStorage fallback for database operations
class LocalStorageDB {
  constructor() {
    this.key = 'workpads-localstorage';
    this._load();
  }

  _load() {
    const raw = localStorage.getItem(this.key);
    this.workpads = raw ? JSON.parse(raw) : [];
    this._idCounter = this.workpads.reduce((max, wp) => Math.max(max, wp.id || 0), 0);
  }

  _save() {
    localStorage.setItem(this.key, JSON.stringify(this.workpads));
  }

  async get(id) {
    return this.workpads.find(wp => wp.id === id) || null;
  }

  async put(workpad) {
    const index = this.workpads.findIndex(wp => wp.id === workpad.id);
    if (index >= 0) {
      this.workpads[index] = workpad;
    } else {
      this._idCounter++;
      workpad.id = this._idCounter;
      this.workpads.push(workpad);
    }
    this._save();
    return workpad.id;
  }

  async add(workpad) {
    this._idCounter++;
    const newWorkpad = { id: this._idCounter, ...workpad };
    this.workpads.push(newWorkpad);
    this._save();
    return newWorkpad.id;
  }
}

let db;
let isFallback = false;

async function initDB() {
  try {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB not supported');
    }

    // Dexie is now available globally via the script tag
    db = new Dexie('WorkpadsDB');
    db.version(1).stores({
      workpads: '++id,work,customer,location,date,startTime,endTime,hours,meetingTime,meetingLocation,workers,thingsToBring,thingsToPurchase,actions,workDetails,workStory'
    });

    await db.open();
  } catch (err) {
    console.warn('IndexedDB not supported or inaccessible. Falling back to localStorage.', err);
    await showMessageBox('IndexedDB not supported or inaccessible. Falling back to localStorage. Some features may be limited.');
    isFallback = true;
    db = new LocalStorageDB();
  }
}

(async function () {
  await initDB();

  const urlParams = new URLSearchParams(window.location.search);
  const index = urlParams.get('id'); // This `index` is now the `id` for Dexie/LocalStorage

  const pageTitle = document.getElementById('page-title');
  const form = document.getElementById('workpad-form');

  const workInput = document.getElementById('work');
  const customerInput = document.getElementById('customer');
  const locationInput = document.getElementById('location');
  const dateInput = document.getElementById('date');
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const hoursInput = document.getElementById('hours');
  const meetingTimeInput = document.getElementById('meetingTime');
  const meetingLocationInput = document.getElementById('meetingLocation');
  const detailsInput = document.getElementById('details');
  const storyInput = document.getElementById('story');

  const workersContainer = document.getElementById('workers-container');
  const addWorkerBtn = document.getElementById('add-worker-btn');
  const thingsToBringContainer = document.getElementById('things-to-bring-container');
  const addBringBtn = document.getElementById('add-bring-btn');
  const thingsToPurchaseContainer = document.getElementById('things-to-purchase-container');
  const addPurchaseBtn = document.getElementById('add-purchase-btn');
  const actionsContainer = document.getElementById('actions-container');
  const addActionBtn = document.getElementById('add-action-btn');

  let workers = [];
  let thingsToBring = [];
  let thingsToPurchase = [];
  let actions = [];

  function renderDynamicList(container, items, placeholder, renderCallback, isActionList = false) {
    container.innerHTML = '';
    items.forEach((item, idx) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'dynamic-list-item'; // Add a class for styling
      if (isActionList) {
        itemDiv.innerHTML = `
          <input type="text" placeholder="Action title" value="${item.shortText || ''}" data-index="${idx}" class="action-title" />
          <textarea placeholder="Action notes" class="action-notes">${item.longText || ''}</textarea>
          <button type="button" class="remove-item-btn" data-index="${idx}" aria-label="Remove item">🗑️ Remove</button>
        `;
      } else {
        itemDiv.innerHTML = `
          <input type="text" placeholder="${placeholder}" value="${item}" data-index="${idx}" />
          <button type="button" class="remove-item-btn" data-index="${idx}" aria-label="Remove item">🗑️ Remove</button>
        `;
      }
      container.appendChild(itemDiv);
    });

    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (isActionList) {
          actions[idx].shortText = e.target.value;
        } else {
          items[idx] = e.target.value;
        }
      });
    });

    if (isActionList) {
      container.querySelectorAll('textarea').forEach(area => {
        area.addEventListener('input', (e) => {
          const idx = parseInt(e.target.closest('.dynamic-list-item').querySelector('input').dataset.index, 10);
          actions[idx].longText = e.target.value;
        });
      });
    }

    container.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        items.splice(idx, 1);
        renderCallback(); // Re-render the list after removal
      });
    });
  }

  function renderWorkers() {
    renderDynamicList(workersContainer, workers, 'Worker name', renderWorkers);
  }

  function renderThingsToBring() {
    renderDynamicList(thingsToBringContainer, thingsToBring, 'Item to bring', renderThingsToBring);
  }

  function renderThingsToPurchase() {
    renderDynamicList(thingsToPurchaseContainer, thingsToPurchase, 'Item to purchase', renderThingsToPurchase);
  }

  function renderActions() {
    renderDynamicList(actionsContainer, actions, 'Action title', renderActions, true);
  }

  addWorkerBtn.addEventListener('click', () => {
    workers.push('');
    renderWorkers();
  });

  addBringBtn.addEventListener('click', () => {
    thingsToBring.push('');
    renderThingsToBring();
  });

  addPurchaseBtn.addEventListener('click', () => {
    thingsToPurchase.push('');
    renderThingsToPurchase();
  });

  addActionBtn.addEventListener('click', () => {
    actions.push({ shortText: '', longText: '' });
    renderActions();
  });

  if (index !== null) {
    const pad = await db.get(Number(index));
    if (pad) {
      pageTitle.textContent = 'Edit Workpad';
      workInput.value = pad.work || '';
      customerInput.value = pad.customer || '';
      locationInput.value = pad.location || '';
      dateInput.value = pad.date || '';
      startTimeInput.value = pad.startTime || '';
      endTimeInput.value = pad.endTime || '';
      hoursInput.value = pad.hours || '';
      meetingTimeInput.value = pad.meetingTime || '';
      meetingLocationInput.value = pad.meetingLocation || '';
      workers = Array.isArray(pad.workers) ? pad.workers : [];
      thingsToBring = Array.isArray(pad.thingsToBring) ? pad.thingsToBring : [];
      thingsToPurchase = Array.isArray(pad.thingsToPurchase) ? pad.thingsToPurchase : [];
      actions = Array.isArray(pad.actions) ? pad.actions : [];
      detailsInput.value = pad.workDetails || '';
      storyInput.value = pad.workStory || '';
    } else {
      // If ID is provided but workpad not found, treat as new
      pageTitle.textContent = 'New Workpad';
      await showMessageBox(`Workpad with ID ${index} not found. Creating a new one.`);
      index = null; // Ensure it's treated as a new entry
    }
  } else {
    pageTitle.textContent = 'New Workpad';
  }

  // Initial render of all dynamic lists
  renderWorkers();
  renderThingsToBring();
  renderThingsToPurchase();
  renderActions();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPad = {
      work: workInput.value.trim(),
      customer: customerInput.value.trim(),
      location: locationInput.value.trim(),
      date: dateInput.value,
      startTime: startTimeInput.value.trim(),
      endTime: endTimeInput.value.trim(),
      hours: hoursInput.value.trim(),
      meetingTime: meetingTimeInput.value.trim(),
      meetingLocation: meetingLocationInput.value.trim(),
      workers: workers, // Use the live array
      thingsToBring: thingsToBring, // Use the live array
      thingsToPurchase: thingsToPurchase, // Use the live array
      actions: actions, // Use the live array
      workDetails: detailsInput.value.trim(),
      workStory: storyInput.value.trim(),
    };

    try {
      if (index !== null) {
        await db.put({ id: Number(index), ...newPad });
        await showMessageBox('Workpad updated successfully!');
      } else {
        const newId = await db.add(newPad);
        await showMessageBox('Workpad saved successfully!');
      }
      window.location.href = '/index.html'; // Redirect to the listing page
    } catch (error) {
      console.error('Error saving workpad:', error);
      await showMessageBox('Failed to save workpad. Please try again later.');
    }
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    window.location.href = '/index.html'; // Redirect to the listing page
  });
})();
