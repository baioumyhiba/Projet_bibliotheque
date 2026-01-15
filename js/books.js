const role = "admin";
let xmlData;
let currentEditBook = null;
let currentImageData = null; // Stocke l'image en Base64

function loadXSLT(xml, xslFile, outputId){
    const xhttpXSL = new XMLHttpRequest();
    xhttpXSL.open("GET", xslFile, true);
    xhttpXSL.onreadystatechange = function(){
        if(xhttpXSL.readyState === 4 && xhttpXSL.status === 200){
            const xsl = xhttpXSL.responseXML;
            let transformed;
            if(window.XSLTProcessor){
                const xsltProcessor = new XSLTProcessor();
                xsltProcessor.importStylesheet(xsl);
                transformed = xsltProcessor.transformToFragment(xml, document);
                const container = document.getElementById(outputId);
                container.innerHTML = "";
                container.appendChild(transformed);
            } else { console.error("XSLT not supported"); }
        }
    }
    xhttpXSL.send();
}

window.onload = function() {
    const xhttpXML = new XMLHttpRequest();
    xhttpXML.open("GET", "data/books/books.xml", true);
    xhttpXML.onreadystatechange = function() {
        if(xhttpXML.readyState === 4 && xhttpXML.status === 200){
            xmlData = xhttpXML.responseXML;
            loadXSLT(xmlData, "data/books/books.xsl", "booksContainer");
        }
    }
    xhttpXML.send();
}

function showDetails(title, img, desc) {
    const detail = document.getElementById('book-details');
    detail.style.display = 'block';
    document.getElementById('detail-title').innerText = title;
    document.getElementById('detail-img').src = img;
    document.getElementById('detail-desc').innerText = desc;
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeDetails() { document.getElementById('book-details').style.display = 'none'; }

function openEditModal(titre="", auteur="", desc="", img=""){
    currentEditBook = titre;
    document.getElementById('edit-modal-title').innerText = titre ? "Modifier Livre" : "Ajouter Livre";
    document.getElementById('edit-titre').value = titre;
    document.getElementById('edit-auteur').value = auteur;
    document.getElementById('edit-desc').value = desc;
    currentImageData = img;
    document.getElementById('edit-img-file').value = "";
    document.getElementById('edit-modal').style.display = 'block';
}
function closeEditModal(){ document.getElementById('edit-modal').style.display='none'; }
function openAddModal(){ openEditModal(); }

// Lire l'image choisie
document.getElementById('edit-img-file').addEventListener('change', function(e){
    const file = e.target.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = function(evt){ currentImageData = evt.target.result; }
        reader.readAsDataURL(file); // Convertit en Base64
    }
});

// Supprimer avec confirmation
function deleteBookConfirm(titre){
    if(confirm(`Êtes-vous sûr de vouloir supprimer "${titre}" ?`)){
        deleteBook(titre);
    }
}

function deleteBook(titre){
    const livres = Array.from(xmlData.getElementsByTagName('livre'));
    const livre = livres.find(l => l.getElementsByTagName('titre')[0].textContent === titre);
    if(livre){
        xmlData.documentElement.removeChild(livre);
        loadXSLT(xmlData, "data/books/books.xsl", "booksContainer");
    }
}

// Formulaire Ajouter / Modifier
document.getElementById('edit-form').addEventListener('submit', function(e){
    e.preventDefault();
    const titre = document.getElementById('edit-titre').value;
    const auteur = document.getElementById('edit-auteur').value;
    const desc = document.getElementById('edit-desc').value;
    const img = currentImageData;

    if(currentEditBook){ // Modifier
        const livre = Array.from(xmlData.getElementsByTagName('livre'))
            .find(l => l.getElementsByTagName('titre')[0].textContent === currentEditBook);
        livre.getElementsByTagName('titre')[0].textContent = titre;
        livre.getElementsByTagName('authors')[0].getElementsByTagName('auteurRef')[0].setAttribute('id', auteur);
        livre.getElementsByTagName('description')[0].textContent = desc;
        livre.getElementsByTagName('image')[0].textContent = img;
    } else { // Ajouter
        const newLivre = xmlData.createElement('livre');
        const t = xmlData.createElement('titre'); t.textContent = titre;
        const a = xmlData.createElement('authors'); 
        const au = xmlData.createElement('auteurRef'); au.setAttribute('id', auteur); a.appendChild(au);
        const d = xmlData.createElement('description'); d.textContent = desc;
        const im = xmlData.createElement('image'); im.textContent = img;
        const an = xmlData.createElement('anneePublication'); an.textContent = new Date().getFullYear();
        const dispo = xmlData.createElement('disponibilite'); dispo.textContent='true';
        newLivre.appendChild(t);
        newLivre.appendChild(a);
        newLivre.appendChild(d);
        newLivre.appendChild(im);
        newLivre.appendChild(an);
        newLivre.appendChild(dispo);
        xmlData.documentElement.appendChild(newLivre);
    }

    currentEditBook = null;
    closeEditModal();
    loadXSLT(xmlData, "data/books/books.xsl", "booksContainer");

    // ⚠️ Pour sauvegarder dans le fichier XML réel, il faut envoyer xmlData à un backend
});
