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

  async getAll() {
    return this.workpads;
  }

  async get(id) {
    return this.workpads.find(wp => wp.id === id) || null;
  }

  async add(workpad) {
    this._idCounter++;
    const newWorkpad = { id: this._idCounter, ...workpad };
    this.workpads.push(newWorkpad);
    this._save();
    return newWorkpad.id;
  }

  async put(workpad) {
    const index = this.workpads.findIndex(wp => wp.id === workpad.id);
    if (index >= 0) {
      this.workpads[index] = workpad;
      this._save();
      return workpad.id;
    } else {
      return this.add(workpad);
    }
  }

  // Simple offset/limit for LocalStorageDB to mimic Dexie's pagination
  offset(offset) {
    const self = this;
    return {
      limit(limit) {
        return {
          async toArray() {
            return self.workpads.slice(offset, offset + limit);
          }
        };
      }
    };
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

    // Example: prepare for schema upgrade v2 in future
    // Uncomment and edit when you add new fields or change schema
    /*
    db.version(2).stores({
      workpads: '++id,work,customer,location,date,startTime,endTime,hours,meetingTime,meetingLocation,newField,workers,thingsToBring,thingsToPurchase,actions,workDetails,workStory'
    }).upgrade(tx => {
      return tx.table('workpads').toCollection().modify(workpad => {
        if (!workpad.newField) workpad.newField = 'defaultValue';
      });
    });
    */

    await db.open();

  } catch (err) {
    console.warn('IndexedDB not supported or not accessible. Falling back to localStorage.', err);
    await showMessageBox('IndexedDB not supported or not accessible. Falling back to localStorage. Some features may be limited.');
    isFallback = true;
    db = new LocalStorageDB();
  }
}

async function loadWorkpads(page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;

    let workpads;

    if (!isFallback) {
      // Dexie's offset and limit
      workpads = await db.workpads.offset(offset).limit(pageSize).toArray();
    } else {
      // LocalStorageDB's offset and limit
      workpads = await db.offset(offset).limit(pageSize).toArray();
    }

    renderWorkpads(workpads);
  } catch (error) {
    console.error('Error loading workpads:', error);
    await showMessageBox('Failed to load workpads. Please try again later.');
  }
}

async function renderWorkpads(workpads) {
  const workpadsList = document.getElementById('workpads-list');
  workpadsList.innerHTML = ''; // Clear existing list

  if (workpads.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-list-message'; // Add a class for styling
    emptyMessage.textContent = 'No workpads yet. Create one!';
    workpadsList.appendChild(emptyMessage);
    return;
  }

  workpads.forEach((pad) => {
    // Ensure arrays are initialized to prevent errors if undefined
    pad.workers = Array.isArray(pad.workers) ? pad.workers : [];
    pad.thingsToBring = Array.isArray(pad.thingsToBring) ? pad.thingsToBring : [];
    pad.thingsToPurchase = Array.isArray(pad.thingsToPurchase) ? pad.thingsToPurchase : [];
    pad.actions = Array.isArray(pad.actions) ? pad.actions : [];

    const listItem = document.createElement('li');
    listItem.className = 'workpad-item';

    const div = document.createElement('div');

    const h3 = document.createElement('h3');
    h3.textContent = pad.work || 'Untitled Workpad';
    div.appendChild(h3);

    // Display key details
    const detailsHtml = `
      <p><strong>Customer:</strong> ${pad.customer || 'N/A'}</p>
      <p><strong>Location:</strong> ${pad.location || 'N/A'}</p>
      <p><strong>Date:</strong> ${pad.date ? new Date(pad.date).toLocaleDateString() : 'No Date'}</p>
      <p><strong>Start Time:</strong> ${pad.startTime || 'N/A'}</p>
      <p><strong>End Time:</strong> ${pad.endTime || 'N/A'}</p>
      <p><strong>Hours:</strong> ${pad.hours || 'N/A'}</p>
      <p><strong>Meeting Time:</strong> ${pad.meetingTime || 'N/A'}</p>
      <p><strong>Meeting Location:</strong> ${pad.meetingLocation || 'N/A'}</p>
    `;
    div.insertAdjacentHTML('beforeend', detailsHtml);


    // Render lists if they have items
    const renderDetailList = (title, items, itemKey = null) => {
      if (items.length > 0) {
        const listDiv = document.createElement('div');
        listDiv.className = 'workpad-sub-detail'; // For styling
        listDiv.innerHTML = `<strong>${title}:</strong>`;
        const ul = document.createElement('ul');
        items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = itemKey ? item[itemKey] : item;
          ul.appendChild(li);
        });
        listDiv.appendChild(ul);
        div.appendChild(listDiv);
      }
    };

    renderDetailList('Workers', pad.workers);
    renderDetailList('Things to Bring', pad.thingsToBring);
    renderDetailList('Things to Purchase', pad.thingsToPurchase);

    if (pad.actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'workpad-sub-detail';
      actionsDiv.innerHTML = '<strong>Actions:</strong>';
      const ul = document.createElement('ul');
      pad.actions.forEach((action) => {
        const li = document.createElement('li');
        li.textContent = `${action.shortText || 'No Title'}: ${action.longText || 'No Notes'}`;
        ul.appendChild(li);
      });
      actionsDiv.appendChild(ul);
      div.appendChild(actionsDiv);
    }

    // Display work details and story if present
    if (pad.workDetails) {
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'workpad-sub-detail';
      detailsDiv.innerHTML = `<strong>Work Details:</strong> <p>${pad.workDetails}</p>`;
      div.appendChild(detailsDiv);
    }

    if (pad.workStory) {
      const storyDiv = document.createElement('div');
      storyDiv.className = 'workpad-sub-detail';
      storyDiv.innerHTML = `<strong>Work Story:</strong> <p>${pad.workStory}</p>`;
      div.appendChild(storyDiv);
    }

    const viewLink = document.createElement('a');
    viewLink.href = `/workpad.html?id=${pad.id}`; // Link to the new view page
    viewLink.setAttribute('aria-label', `View workpad ${pad.id}`);
    viewLink.textContent = 'View';
    viewLink.className = 'view-button'; // Add a class for styling

    const editLink = document.createElement('a');
    editLink.href = `/edit.html?id=${pad.id}`;
    editLink.setAttribute('aria-label', `Edit workpad ${pad.id}`);
    editLink.textContent = 'Edit';
    editLink.className = 'edit-button'; // Add a class for styling

    // Add a delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.setAttribute('data-id', pad.id);
    deleteButton.addEventListener('click', async (e) => {
      const confirmDelete = await showMessageBox('Are you sure you want to delete this workpad?');
      if (confirmDelete) { // Currently showMessageBox always resolves, need a confirmation dialog for true/false
        // For a real confirmation, you'd need a custom dialog with Yes/No buttons
        // For now, assuming OK means proceed with delete (not ideal for 'confirm')
        try {
          if (!isFallback) {
            await db.workpads.delete(Number(e.target.dataset.id));
          } else {
            // For LocalStorageDB, we need to find and remove it manually
            const idToDelete = Number(e.target.dataset.id);
            const indexToRemove = db.workpads.findIndex(wp => wp.id === idToDelete);
            if (indexToRemove !== -1) {
              db.workpads.splice(indexToRemove, 1);
              db._save(); // Manually save after modification
            }
          }
          await showMessageBox('Workpad deleted successfully!');
          loadWorkpads(); // Reload the list after deletion
        } catch (error) {
          console.error('Error deleting workpad:', error);
          await showMessageBox('Failed to delete workpad. Please try again later.');
        }
      }
    });


    listItem.appendChild(div);
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'workpad-item-actions'; // Container for buttons
    actionsDiv.appendChild(viewLink);
    actionsDiv.appendChild(editLink);
    actionsDiv.appendChild(deleteButton); // Add delete button
    listItem.appendChild(actionsDiv);
    workpadsList.appendChild(listItem);
  });
}

(async () => {
  await initDB();
  await loadWorkpads();
})();
