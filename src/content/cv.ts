import type { Cv } from "../domain/Cv";

/**
 * Ben's real CV (F-030), kept in French as written by its owner.
 * Never invent or embellish content here: change it only from the owner's input.
 * Skill levels were derived from years of use and are for the owner to review.
 */
export const CV: Cv = {
  profile: {
    name: "Ben",
    headline: "Lead / Développeur Full Stack",
    summary: [
      "Lead / Développeur Full Stack expérimenté avec plus de 15 ans d'expérience dans le développement web, principalement autour des technologies PHP, JavaScript (notamment Ember.js, React, Vue.js) et des frameworks comme Symfony ou Laravel.",
      "Actuellement chez BoondManager, je participe activement à l'évolution produit avec une approche Shape Up, en développant de nouvelles fonctionnalités back & front (API, CRUD, composants UI, intégrations tierces comme Mindee) sur une stack moderne : PHP 8.2, Ember.js Octane, MariaDB, RabbitMQ, Solr, Cypress, Jenkins.",
      "Solide background en leadership technique, j'ai encadré des équipes, mis en place de bonnes pratiques et géré des roadmaps techniques dans mes expériences précédentes chez E-monsite et PERI-G.",
      "Passionné, rigoureux et curieux, j'aime faire évoluer les outils tout en gardant un œil sur la qualité du code et l'expérience utilisateur.",
    ],
  },

  experiences: [
    {
      company: "BoondManager",
      role: "Développeur Full Stack – Team Features",
      startDate: "2023-07",
      contract: "CDI",
      workMode: "remote",
      description:
        "Je participe à l'évolution continue de notre outil interne en concevant et en intégrant de nouvelles fonctionnalités à chaque cycle de développement (méthodologie ShapeUp – cycles de 4 à 6 semaines).",
      highlights: [
        "Développement de nouveaux modules métiers (ex. gestion des factures fournisseurs avec intégration de l'API Mindee, gestion des absences imposées) : conception du CRUD complet, API, vues et composants front associés.",
        "Évolution et maintenance de l'existant : création/ajout d'endpoints, amélioration de composants Ember, migrations techniques (vers Ember Octane), mise à jour de la documentation API (RAML).",
      ],
      technologies: [
        "PHP 8.2",
        "Ember.js",
        "MariaDB",
        "RabbitMQ",
        "Solr",
        "Cypress",
        "Jenkins",
        "Claude",
      ],
    },
    {
      company: "PERI-G",
      role: "Manager Lead Développeur",
      startDate: "2021-10",
      endDate: "2023-07",
      contract: "CDI",
      location: "Boves, Hauts-de-France, France",
      workMode: "hybrid",
      highlights: [],
      technologies: [],
    },
    {
      company: "PERI-G",
      role: "Lead Développeur PHP",
      startDate: "2019-07",
      endDate: "2021-10",
      contract: "CDI",
      location: "Boves, Picardie, France",
      highlights: [
        "Développement projets et bundles sous Symfony 4 et 5",
        "Développement mini-projet ReactJs + ApiPlatform",
        "Amélioration et mise en place de bonnes pratiques projets PHP existants",
        "Coordination de travail avec freelance",
        "Commande Symfony pour convertir fichier JSON en base de données MySQL",
      ],
      technologies: ["Symfony", "PHP", "React", "API Platform", "MySQL"],
    },
    {
      company: "E-monsite",
      role: "Lead Développeur PHP",
      startDate: "2018-10",
      endDate: "2019-07",
      contract: "CDI",
      location: "Amiens, Hauts-de-France, France",
      highlights: [
        "Gestion et code review du code des développeurs (équipe de 4 personnes)",
        "Mise en place d'une roadmap technique court et moyen terme",
        "Propositions/études des améliorations pour la plateforme",
      ],
      technologies: ["PHP"],
    },
    {
      company: "E-monsite",
      role: "Développeur PHP",
      startDate: "2014-10",
      endDate: "2018-09",
      contract: "CDI",
      location: "Amiens, Hauts-de-France, France",
      description: "Maintenance et mise à jour du CMS propriétaire.",
      highlights: [
        "Notification via SMS",
        "Intégration d'un nouveau moyen de paiement",
        "Mise en place de certificat SSL",
        "Gestion abonnement pour les membres",
        "AJAX processus d'achat",
        "Refonte des offres",
      ],
      technologies: ["PHP", "AJAX"],
    },
    {
      company: "Ciorane",
      role: "Développeur PHP consultant",
      startDate: "2014-05",
      endDate: "2014-10",
      contract: "CDI",
      location: "Courbevoie",
      highlights: ["Développement d'un service de SMS sous CodeIgniter"],
      technologies: ["PHP", "CodeIgniter"],
    },
    {
      company: "Locasun",
      role: "Développeur PHP",
      startDate: "2012-04",
      endDate: "2014-05",
      contract: "CDI",
      location: "Franconville, Île-de-France, France",
      description:
        "Développement de nouvelles fonctionnalités et amélioration des sites Locasun et Locasun-vp.",
      highlights: [
        "Gestion flux partenaire (via XML, SOAP, REST)",
        "Programmes de relance emailing",
        "Procédure de vente en ligne complète avec module de paiement CB intégré au site",
        "Développement site mobile",
        "Refonte de pages HTML",
        "Maintenance évolutive",
        "Migration en Symfony2",
      ],
      technologies: ["PHP", "Symfony2", "XML", "SOAP", "REST", "SVN"],
    },
    {
      company: "EISTI",
      role: "Webmaster / développeur PHP",
      startDate: "2008-12",
      endDate: "2010-12",
      contract: "Contrat en alternance",
      location: "Cergy, Île-de-France, France",
      highlights: [],
      technologies: ["PHP"],
    },
  ],

  education: [
    {
      school: "AKOR Alternance",
      diploma: "BTS, Informatique | option développement",
      startDate: "2008",
      endDate: "2010",
    },
  ],

  skills: [
    { name: "PHP", level: 5, category: "Back-end" },
    { name: "Symfony", level: 4, category: "Back-end" },
    { name: "Laravel", level: 3, category: "Back-end" },
    { name: "Fat-Free", level: 2, category: "Back-end" },
    { name: "API REST", level: 5, category: "Back-end" },
    { name: "RabbitMQ", level: 3, category: "Back-end" },
    { name: "MySQL / MariaDB", level: 5, category: "Back-end" },
    { name: "Solr", level: 2, category: "Back-end" },
    { name: "JavaScript", level: 4, category: "Front-end" },
    { name: "TypeScript", level: 3, category: "Front-end" },
    { name: "Ember.js", level: 4, category: "Front-end" },
    { name: "React", level: 3, category: "Front-end" },
    { name: "Vue.js", level: 3, category: "Front-end" },
    { name: "Cypress", level: 3, category: "Tests & CI/CD" },
    { name: "Jenkins", level: 3, category: "Tests & CI/CD" },
    { name: "Shape Up", level: 4, category: "Méthodologies" },
    { name: "Gestion d'équipe", level: 4, category: "Méthodologies" },
    { name: "Revue de code", level: 5, category: "Méthodologies" },
    { name: "Coordination de freelances", level: 3, category: "Méthodologies" },
  ],

  languages: [
    { name: "Français", level: "Bilingue ou langue natale" },
    { name: "Anglais", level: "Capacité professionnelle complète" },
  ],

  // No projects listed yet (Projects Lab district, F-073).
  projects: [],
};
