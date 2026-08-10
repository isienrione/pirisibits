/** English UI catalog — source of truth for message keys. */

export const enMessages = Object.freeze({
  // Shell
  'shell.nav.aria': 'Tour navigation',
  'shell.tab.walk': 'Walk',
  'shell.tab.tour': 'Tour',
  'shell.tab.map': 'Map',
  'shell.tab.journal': 'Journal',

  // Language
  'language.label': 'Language',
  'language.sub': 'Applies to the walk, stories, and audio',
  'language.en': 'English',
  'language.es': 'Español',

  // Settings (G1)
  'settings.title': 'Settings',
  'settings.done': 'Done',
  'settings.section.playback': 'Playback',
  'settings.section.sound': 'Sound',
  'settings.section.device': 'Device',
  'settings.section.content': 'Content',
  'settings.section.language': 'Language',
  'settings.section.access': 'Access',
  'settings.narrationSpeed': 'Narration speed',
  'settings.narrationSpeed.sub': 'Default for new chapters',
  'settings.backgroundAudio': 'Background audio',
  'settings.backgroundAudio.sub': 'Ambient bed continues on lock screen',
  'settings.autoAdvance': 'Auto-advance chapters',
  'settings.autoAdvance.sub': 'Where chapters are marked for it',
  'settings.ambientBed': 'Ambient bed',
  'settings.ambientBed.sub': 'Narration volume follows system',
  'settings.ambient.subtle': 'Subtle',
  'settings.ambient.off': 'Off',
  'settings.haptics': 'Haptics',
  'settings.reduceMotion': 'Reduce motion',
  'settings.offline': 'Offline content',
  'settings.pace': 'Your pace',
  'settings.credits': 'Credits',
  'settings.restoreAccess': 'Restore access',

  // Launch settings copy
  'settings.launch.title': 'Settings',
  'settings.launch.subtitle': 'Clear choices for how ChronoWalk walks with you.',
  'settings.launch.tourName': 'Heart of Ancient Rome',
  'settings.launch.tourDescription': 'Your walking tour through Rome.',
  'settings.launch.locationGuidance':
    'Location is used only while you walk the tour, to guide arrivals and nearby landmarks.',
  'settings.launch.offlineDescription': 'Stories, imagery, and audio for your tour.',
  'settings.launch.privacySummary':
    'Your journey, memories, and preferences stay on this device unless you choose to share them.',
  'settings.section.tour': 'Tour settings',
  'settings.section.audio': 'Audio settings',
  'settings.section.offline': 'Offline storage',
  'settings.section.notifications': 'Notifications',
  'settings.section.appearance': 'Appearance',
  'settings.section.help': 'Help & Support',
  'settings.section.privacy': 'Privacy',

  // Approach cues
  'approach.cue.0': 'Almost there. Look up.',
  'approach.cue.1': 'The amphitheatre is beginning to reveal itself.',
  'approach.cue.2': 'Pause for a moment. The next chapter begins just ahead.',
  'approach.cue.3': 'You are close now. Let the city slow you down.',
  'approach.cue.4': 'Listen - the stones are near.',
  'approach.cue.5': 'The next chapter waits just ahead.',
  'approach.cue.6': 'Almost there. Rome opens in front of you.',
  'approach.cue.7': 'Slow your step. You are nearly upon it.',
  'approach.fallback': 'Keep walking - Rome is just ahead.',
  'arrival.fallback': 'Take a second. Look up.',

  // Companion
  'companion.offRoute.eyebrow': 'Off route',
  'companion.offRoute.title': "You're farther from the path",
  'companion.offRoute.subtitle':
    "Head back toward {target} when you're ready - or open the map for bearings.",
  'companion.offRoute.subtitle.generic': "Open the map for bearings when you're ready to continue.",
  'companion.observing.eyebrow': 'Observation',
  'companion.observing.title': 'Take your time',
  'companion.observing.subtitle':
    "Rome isn't going anywhere. Resume walking when you want the next story to find you.",

  // Map bottom card
  'map.card.offRoute.title': "Looks like we've wandered a little",
  'map.card.offRoute.meta': 'No matter - Rome rewards wandering.',
  'map.card.offRoute.cta': 'Back to route',
  'map.card.awaiting.title': 'Your walk begins here',
  'map.card.awaiting.meta': 'Walk to {landmark}',
  'map.card.awaiting.cta.directions': 'Get directions',
  'map.card.awaiting.cta.open': 'Open directions',
  'map.card.awaiting.cta.arrived': "I'm here",
  'map.card.walking.title': 'Walk to {landmark}',
  'map.card.approaching.title': 'Almost at {landmark}',
  'map.card.arrived.title': "You've arrived",
  'map.card.arrived.meta': '{landmark}',
  'map.card.arrived.cta': 'Open story',
  'map.card.afterStory.title': 'Ready when you are',
  'map.card.afterStory.cta': 'Walk to next',
  'map.card.nextStop': 'your next stop',
  'map.card.meta.about': '{distance} · about {walkTime}',
  'map.card.meta.pair': '{distance} · {walkTime}',

  // Errors / chrome
  'error.boundary.title': "Couldn't load ChronoWalk",
  'error.boundary.retry': 'Try again',
  'network.offline': "You're offline",
  'network.offline.detail':
    "You're offline - cached audio and media works normally; navigation data may be unavailable on airplane mode",
  'network.offline.aria': 'Offline mode',
  'network.back': 'Back online',
  'pwa.update.ready': 'A new version is ready',
  'pwa.update.action': 'Refresh',
  'pwa.update.eyebrow': 'New version available',
  'pwa.update.body': 'Tap to refresh when you are ready — browsing is not interrupted.',
  'pwa.update.tap': 'Tap to refresh',
  'pwa.update.later': 'Later',

  // Free Pantheon acquisition
  'pantheon.free.eyebrow': 'FREE · PANTHEON PART 1 OF 4 · EXTERIOR',
  'pantheon.free.h1': 'Try the Pantheon exterior chapter free.',
  'pantheon.free.lead':
    'Full 4 minute chapter (not a teaser) with audio and a Then/Now visual reconstruction demo.',
  'pantheon.free.interactTipEyebrow': 'This phone is the demo',
  'pantheon.free.interactPrompt': 'Interact with the phone screen and enjoy a piece of ChronoWalk',
  'pantheon.free.secondaryCta': 'Explore the full 21-stop Rome tour',
  'pantheon.free.trustLine': 'No app download · Browser · Free',
  'pantheon.free.includes.0': 'Full exterior audio chapter',
  'pantheon.free.includes.1': 'Then/Now reconstruction',
  'pantheon.free.includes.2': 'Part 1 of 4 only',
  'pantheon.free.upgradeHeading': 'Want the rest of the Pantheon?',
  'pantheon.free.upgradeLead':
    'Unlock Parts 2-4 (including the interior) plus 21 Rome stops: Colosseum, Forum, and more.',
  'pantheon.free.headerCta': 'Get the full Rome tour',
  'pantheon.free.howItWorks': 'How it works',
  'pantheon.free.fullTour': 'Full Rome tour',
  'pantheon.free.faqHeading': 'Quick answers',
  'pantheon.free.faq.0.q': 'Is this the whole Pantheon experience?',
  'pantheon.free.faq.0.a':
    'No. This free sneak peek is Pantheon Part 1 of 4: the full exterior chapter (~4 minutes) with its complete audio and reconstruction. Three more Pantheon chapters, including the interior, unlock with the paid Rome tour.',
  'pantheon.free.faq.1.q': 'Do I need to download an app?',
  'pantheon.free.faq.1.a':
    'No. ChronoWalk opens in your browser. No App Store download is required.',
  'pantheon.free.faq.2.q': 'Does this include Pantheon admission?',
  'pantheon.free.faq.2.a':
    'No. Monument admission tickets are not included. ChronoWalk is an independent self-guided audio experience, not an official monument audio guide.',
  'pantheon.free.faq.3.q': 'Can I use it before or during my visit?',
  'pantheon.free.faq.3.a':
    'Yes. Open it while connected to start. You can prepare the experience before walking if you want to use it offline.',

  // Product truth snippets used in-app
  'product.places21': '21 places',
  'product.stops21': '21 stops',
  'chapter.fallback': 'Chapter',

  // Common actions
  'action.continue': 'Continue',
  'action.close': 'Close',
  'action.cancel': 'Cancel',
  'action.done': 'Done',
  'action.retry': 'Try again',
  'action.openStory': 'Open story',
  'action.getDirections': 'Get directions',

  // Settings sheet (live companion)
  'settings.sheet.audioSpeed': 'Audio speed',
  'settings.sheet.readInstead': 'Read instead of listen',
  'settings.sheet.textSize': 'Text size',
  'settings.sheet.backgroundPlay': 'Keep playing in background',
  'settings.sheet.haptics': 'Haptics',
  'settings.sheet.reduceMotion': 'Reduce motion',
  'settings.sheet.offline': 'Download for offline',
  'settings.sheet.offline.ready': 'Ready',
  'settings.sheet.restore': 'Restore purchase',
  'settings.sheet.walkTogether': 'Walk together',
  'settings.sheet.changeRoute': 'Change route',
  'settings.sheet.help': 'Help',
  'settings.sheet.about': 'About & credits',
  'settings.sheet.analytics': 'Analytics preferences',
  'settings.sheet.install': 'Add to Home Screen',
  'map.card.approaching.meta': 'Slow your pace',
  'map.card.approaching.titleNamed': '{landmark} is just ahead',
  'map.card.approaching.cta': "I'm here",
  'map.card.afterStory.titleShort': 'Next stop',
  'map.card.afterStory.ctaNamed': 'Walk to {landmark}',
  'map.card.awaiting.titleNamed': 'Tour begins at {landmark}',
  'map.card.awaiting.cta.walking': 'Get walking directions',
  'map.card.walking.titleNamed': 'Walking to {landmark}',
  'map.card.walking.cta': 'Directions',
})
