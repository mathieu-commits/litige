// =============================================
// Gestion des avis et menu mobile - Demecall
// =============================================

// Attendre que la page soit entièrement chargée
document.addEventListener('DOMContentLoaded', () => {
  // Gestion du menu mobile
  setupMobileMenu();

  // Charger les avis validés et les afficher
  loadValidatedAvis();

  // Si on est sur la page de soumission d'avis, configurer le formulaire
  const avisForm = document.getElementById('avis-form');
  if (avisForm) {
    setupAvisForm();
  }

  // Si on est sur la page admin, configurer les boutons de validation
  if (document.querySelector('.valider-btn')) {
    setupValidationButtons();
  }

  // Si on est sur la page de contact, configurer le formulaire de contact
  const litigeForm = document.getElementById('litige-form');
  if (litigeForm) {
    setupContactForm();
  }
});

// =============================================
// 1. Gestion du menu mobile
// =============================================
function setupMobileMenu() {
  // Créer le bouton menu si nécessaire
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = '☰';
  menuToggle.style.display = 'none'; // Masqué par défaut sur desktop

  const nav = document.querySelector('nav');
  if (nav) {
    // Insère le bouton menu avant les liens de navigation
    const logo = nav.querySelector('.logo');
    if (logo) {
      logo.after(menuToggle);
    }

    // Gestion du clic sur le bouton menu
    menuToggle.addEventListener('click', function() {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) {
        navLinks.classList.toggle('active');
      }
    });
  }

  // Gestion du menu en fonction de la taille de l'écran
  function handleResize() {
    const navLinks = document.querySelector('.nav-links');
    if (window.innerWidth <= 768) {
      menuToggle.style.display = 'block';
      if (navLinks) {
        navLinks.style.display = 'none';
      }
    } else {
      menuToggle.style.display = 'none';
      if (navLinks) {
        navLinks.style.display = 'flex';
        navLinks.classList.remove('active');
      }
    }
  }

  // Appelle la fonction au chargement et au redimensionnement
  window.addEventListener('resize', handleResize);
  handleResize();

  // Fermer le menu quand on clique sur un lien
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          navLinks.classList.remove('active');
        }
      });
    });
  }
}

// =============================================
// 2. Charger et afficher les avis validés
// =============================================
function loadValidatedAvis() {
  fetch('validated-avis.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des avis validés.");
      }
      return response.json();
    })
    .then((avisList) => {
      displayAvis(avisList, 'avis-list');
    })
    .catch((error) => {
      console.error("Erreur :", error);
      const container = document.getElementById('avis-list');
      if (container) {
        container.innerHTML = "<p>Impossible de charger les avis pour le moment.</p>";
      }
    });
}

// =============================================
// 3. Afficher les avis dans le conteneur spécifié
// =============================================
function displayAvis(avisList, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (avisList.length === 0) {
    container.innerHTML = "<p>Aucun avis pour le moment.</p>";
    return;
  }

  container.innerHTML = avisList
    .map(
      (avis) => `
      <div class="avis-item">
        <h3>${avis.nom || "Anonyme"}</h3>
        <div class="note">Note : ${avis.note || "?"}/5</div>
        <p>${avis.commentaire || ""}</p>
        <small>Posté le ${avis.date ? new Date(avis.date).toLocaleDateString("fr-FR") : "?"}</small>
      </div>
    `
    )
    .join("");
}

// =============================================
// 4. Configurer le formulaire de soumission d'avis
// =============================================
function setupAvisForm() {
  const form = document.getElementById('avis-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Récupérer les valeurs du formulaire
    const nom = document.getElementById('nom').value;
    const note = document.getElementById('note').value;
    const commentaire = document.getElementById('commentaire').value;

    // Créer un nouvel avis
    const nouvelAvis = {
      id: Date.now(), // ID unique basé sur le timestamp
      nom: nom,
      note: parseInt(note),
      commentaire: commentaire,
      date: new Date().toISOString().split('T')[0],
    };

    // Ajouter l'avis aux avis en attente
    addPendingAvis(nouvelAvis);

    // Réinitialiser le formulaire
    form.reset();

    // Afficher un message de confirmation
    alert("Merci pour votre avis ! Il sera validé sous peu.");
  });
}

// =============================================
// 5. Ajouter un avis en attente de validation
// =============================================
function addPendingAvis(avis) {
  fetch('pending-avis.json')
    .then((response) => response.json())
    .then((pendingAvis) => {
      pendingAvis.push(avis);

      // Ici, en conditions réelles, tu devrais envoyer les données vers un serveur
      // Pour l'instant, on simule avec localStorage (à adapter selon ton besoin)
      localStorage.setItem('pendingAvis', JSON.stringify(pendingAvis));
      console.log("Avis ajouté aux avis en attente :", avis);
    })
    .catch((error) => {
      console.error("Erreur lors de l'ajout de l'avis :", error);
    });
}

// =============================================
// 6. Configurer les boutons de validation (page admin)
// =============================================
function setupValidationButtons() {
  document.querySelectorAll('.valider-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const avisId = parseInt(e.target.dataset.avisId);
      validateAvis(avisId);
    });
  });
}

// =============================================
// 7. Valider un avis (déplacer de pending à validated)
// =============================================
function validateAvis(avisId) {
  // Récupérer les avis en attente
  let pendingAvis = JSON.parse(localStorage.getItem('pendingAvis')) || [];

  // Trouver l'avis à valider
  const avisIndex = pendingAvis.findIndex((avis) => avis.id === avisId);
  if (avisIndex === -1) {
    console.error("Avis non trouvé.");
    return;
  }

  // Récupérer l'avis
  const avisToValidate = pendingAvis[avisIndex];

  // Ajouter à la liste des avis validés
  fetch('validated-avis.json')
    .then((response) => response.json())
    .then((validatedAvis) => {
      validatedAvis.push(avisToValidate);

      // Sauvegarder les avis validés (simulé avec localStorage)
      localStorage.setItem('validatedAvis', JSON.stringify(validatedAvis));

      // Retirer l'avis de la liste des avis en attente
      pendingAvis.splice(avisIndex, 1);
      localStorage.setItem('pendingAvis', JSON.stringify(pendingAvis));

      // Rafraîchir l'affichage
      loadValidatedAvis();
      alert(`Avis de ${avisToValidate.nom} validé avec succès !`);
    })
    .catch((error) => {
      console.error("Erreur lors de la validation de l'avis :", error);
    });
}

// =============================================
// 8. Configurer le formulaire de contact
// =============================================
function setupContactForm() {
  const form = document.getElementById('litige-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Récupérer les valeurs du formulaire
    const formData = new FormData(form);

    // Validation des champs obligatoires
    const requiredFields = [
      { id: 'nom', name: 'Nom' },
      { id: 'prenom', name: 'Prénom' },
      { id: 'telephone', name: 'Téléphone' },
      { id: 'societe', name: 'Société de déménagement' },
      { id: 'date', name: 'Date du déménagement' },
      { id: 'litige-type', name: 'Type de litige' },
      { id: 'montant', name: 'Montant estimé' }
    ];

    let isValid = true;
    let errorMessage = '';

    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element || !element.value.trim()) {
        isValid = false;
        errorMessage += `- ${field.name} est obligatoire.\n`;
      }
    });

    if (!isValid) {
      alert('Veuillez remplir tous les champs obligatoires :\n' + errorMessage);
      return;
    }

    // Préparation de l'envoi
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Envoi en cours...';
    submitButton.disabled = true;

    // Envoi des données
    fetch('submit-litige.php', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        alert('Merci ! Votre dossier a été envoyé avec succès. Nous vous contacterons rapidement.');
        form.reset();
        // Réinitialiser l'affichage des fichiers
        const fileNamesContainer = document.querySelector('.file-upload p');
        if (fileNamesContainer) {
          fileNamesContainer.textContent = 'Glissez-déposez vos fichiers ici ou cliquez pour parcourir';
        }
      } else {
        alert('Erreur : ' + data.message);
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    })
    .finally(() => {
      submitButton.textContent = 'Envoyer mon dossier pour audit gratuit';
      submitButton.disabled = false;
    });
  });

  // Gestion de l'affichage des noms de fichiers uploadés
  const fileInput = document.getElementById('preuves');
  if (fileInput) {
    const fileNamesContainer = document.querySelector('.file-upload p');
    if (fileInput && fileNamesContainer) {
      fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
          let fileNames = '';
          for (let i = 0; i < this.files.length; i++) {
            fileNames += this.files[i].name + (i < this.files.length - 1 ? ', ' : '');
          }
          fileNamesContainer.textContent = 'Fichiers sélectionnés: ' + fileNames;
        } else {
          fileNamesContainer.textContent = 'Glissez-déposez vos fichiers ici ou cliquez pour parcourir';
        }
      });
    }
  }
}
