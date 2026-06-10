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
      // Ensure IDs are numbers and find the max ID for new entries
      this._idCounter = this.workpads.reduce((max, wp) => Math.max(max, wp.id || 0), 0);
    }
  
    _save() {
      localStorage.setItem(this.key, JSON.stringify(this.workpads));
    }
  
    async get(id) {
      // Find by numeric ID
      return this.workpads.find(wp => wp.id === id) || null;
    }
  
    async put(workpad) {
      const index = this.workpads.findIndex(wp => wp.id === workpad.id);
      if (index >= 0) {
        this.workpads[index] = workpad;
      } else {
        // Assign a new ID if it's a new workpad
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
  
    async getAll() {
      return this.workpads;
    }
  }
  
  let db;
  let isFallback = false;
  
  // Initialize the database (Dexie or LocalStorage fallback)
  async function initDB() {
    try {
      // Check for IndexedDB support
      if (!('indexedDB' in window)) {
        throw new Error('IndexedDB not supported');
      }
  
      // Initialize Dexie database
      db = new Dexie('WorkpadsDB');
      db.version(1).stores({
        workpads: '++id,work,customer,location,date,startTime,endTime,hours,meetingTime,meetingLocation,workers,thingsToBring,thingsToPurchase,actions,workDetails,workStory'
      });
  
      await db.open();
      console.log('IndexedDB initialized successfully.');
    } catch (err) {
      console.warn('IndexedDB not supported or inaccessible. Falling back to localStorage.', err);
      await showMessageBox('IndexedDB not supported or inaccessible. Falling back to localStorage. Some features may be limited.');
      isFallback = true;
      db = new LocalStorageDB(); // Use LocalStorageDB as fallback
    }
  }
  
  // Main logic for displaying a single workpad
  (async function () {
    await initDB(); // Initialize the database
  
    const urlParams = new URLSearchParams(window.location.search);
    const workpadId = urlParams.get('id'); // Get the workpad ID from the URL
  
    const pageTitle = document.getElementById('workpad-title');
    const workpadDetailsContainer = document.getElementById('workpad-details');
  
    // Elements to display workpad data
    const detailWork = document.getElementById('detail-work');
    const detailCustomer = document.getElementById('detail-customer');
    const detailLocation = document.getElementById('detail-location');
    const detailDate = document.getElementById('detail-date');
    const detailStartTime = document.getElementById('detail-startTime');
    const detailEndTime = document.getElementById('detail-endTime');
    const detailHours = document.getElementById('detail-hours');
    const detailMeetingTime = document.getElementById('detail-meetingTime');
    const detailMeetingLocation = document.getElementById('detail-meetingLocation');
    const detailWorkersList = document.getElementById('detail-workers-list');
    const detailThingsToBringList = document.getElementById('detail-thingsToBring-list');
    const detailThingsToPurchaseList = document.getElementById('detail-thingsToPurchase-list');
    const detailActionsList = document.getElementById('detail-actions-list');
    const detailWorkDetails = document.getElementById('detail-workDetails');
    const detailWorkStory = document.getElementById('detail-workStory');
  
    // Hide empty sections initially
    const hideIfEmpty = (elementId, data) => {
      const container = document.getElementById(elementId);
      if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && data.trim() === '')) {
        container.style.display = 'none';
      } else {
        container.style.display = 'block'; // Or 'flex', 'grid' depending on your CSS
      }
    };
  
    if (workpadId === null) {
      pageTitle.textContent = 'Workpad Not Found';
      workpadDetailsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">No workpad ID provided.</p>';
      hideIfEmpty('workpad-details', null); // Hide the entire details container
      return;
    }
  
    try {
      // Fetch the workpad using the unified db.get() method
      const pad = await db.get(Number(workpadId));
  
      if (pad) {
        pageTitle.textContent = pad.work || 'Untitled Workpad';
  
        detailWork.textContent = pad.work || 'N/A';
        detailCustomer.textContent = pad.customer || 'N/A';
        detailLocation.textContent = pad.location || 'N/A';
        detailDate.textContent = pad.date ? new Date(pad.date).toLocaleDateString() : 'No Date';
        detailStartTime.textContent = pad.startTime || 'N/A';
        detailEndTime.textContent = pad.endTime || 'N/A';
        detailHours.textContent = pad.hours || 'N/A';
        detailMeetingTime.textContent = pad.meetingTime || 'N/A';
        detailMeetingLocation.textContent = pad.meetingLocation || 'N/A';
  
        // Render lists
        const renderList = (listElement, items, itemKey = null) => {
          listElement.innerHTML = '';
          if (Array.isArray(items) && items.length > 0) {
            items.forEach(item => {
              const li = document.createElement('li');
              li.textContent = itemKey ? item[itemKey] : item;
              listElement.appendChild(li);
            });
          } else {
            const li = document.createElement('li');
            li.textContent = 'None';
            listElement.appendChild(li);
          }
        };
  
        renderList(detailWorkersList, pad.workers);
        renderList(detailThingsToBringList, pad.thingsToBring);
        renderList(detailThingsToPurchaseList, pad.thingsToPurchase);
  
        detailActionsList.innerHTML = '';
        if (Array.isArray(pad.actions) && pad.actions.length > 0) {
          pad.actions.forEach(action => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${action.shortText || 'No Title'}:</strong> ${action.longText || 'No Notes'}`;
            detailActionsList.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.textContent = 'None';
          detailActionsList.appendChild(li);
        }
  
        detailWorkDetails.textContent = pad.workDetails || 'N/A';
        detailWorkStory.textContent = pad.workStory || 'N/A';
  
        // Hide sections if their data is empty
        hideIfEmpty('detail-workers-container', pad.workers);
        hideIfEmpty('detail-thingsToBring-container', pad.thingsToBring);
        hideIfEmpty('detail-thingsToPurchase-container', pad.thingsToPurchase);
        hideIfEmpty('detail-actions-container', pad.actions);
        hideIfEmpty('detail-workDetails-container', pad.workDetails);
        hideIfEmpty('detail-workStory-container', pad.workStory);
  
      } else {
        pageTitle.textContent = 'Workpad Not Found';
        workpadDetailsContainer.innerHTML = `<p style="text-align: center; margin-top: 20px;">Workpad with ID ${workpadId} not found.</p>`;
      }
    } catch (error) {
      console.error('Error loading workpad:', error);
      await showMessageBox('Failed to load workpad details. Please try again later.');
      pageTitle.textContent = 'Error Loading Workpad';
      workpadDetailsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">An error occurred while loading workpad details.</p>';
    }
  
    // Event Listeners for buttons
    document.getElementById('edit-btn').addEventListener('click', () => {
      window.location.href = `/edit-workpad.html?id=${workpadId}`;
    });
  
    document.getElementById('back-btn').addEventListener('click', () => {
      window.location.href = '/index.html'; // Go back to the listing page
    });
  })();
  