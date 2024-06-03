document.addEventListener('DOMContentLoaded', () => {
    const noteForm = document.getElementById('note-form');
    const noteText = document.getElementById('note-text');
    const notesList = document.getElementById('notes-list');

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (noteText.value.trim() !== "") {
            addNoteToList(noteText.value);
            noteText.value = "";
        }
    });

    function addNoteToList(note) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerText = note;
        notesList.appendChild(noteItem);
    }
});
