# MCHREC

This is a tool inspired by edhrec.com to provide deckbuilding advice for Marvel Champions LCG produced by Fantasy Flight Games.
The decklists and card data for this tool come from the API provided by MarvelCDB
https://marvelcdb.com/api/

## Overview:

### Why should I care?

Some players are simply not very good deckbuilders for this game (like myself!)
A couple of my friends meanwhile are good at finding generic "goodstuff" rather than finding specific cards that pair well with the strengths of individual heroes, and their ability to contribute to a multiplayer game (or prevail against harder villains while playing solo) suffer as a result.
Some players even dismiss earnestly good heroes that they otherwise might have enjoyed for this reason.

### How does it work?

The main focus of the website is going to be the "hero guide" page. All you have to do is choose your hero, then select your aspect (Adam Warlock doesn't have to choose an aspect; Spider-Women must select two).
Once you hit submit, MCHREC goes through all our deck data and finds every card used in each of those decks, then for each individual card, we calculate its "synergy score" - (the popularity of that card for your chosen hero/aspect) minus (the popularity of that card for other decks of that aspect).

On the "staples" page, you can also choose an aspect to find the most popularly used cards for that aspect overall.


## To-Do / Wishlist

#### Heroes at a glance
Once a hero is chosen, display sample stats for decks/aspect by the time period. That way users don't have to make four queries to find the most popular aspect for that hero


#### Clickable modals of generated cards to read text and see the list of packs that card comes from
Or a toggle to show text instead of image - more accessible that way


#### Individual Card Search Bar
A search bar to be able to select individual aspect cards. Could enable the following:
##### Reverse Synergy Card Lookup
User selects an individual aspect card, we find the most popular heroes that run that card
##### Aspect Card Synergy Spotlight
From the selected aspect, we run synergy math as if it's the hero to find the cards that are most commonly run with it.
(For Basic cards, maybe it's worth running the query separately for each aspect)


#### Inclusion/Exclusion of "Indicator Cards"
Prerequisite: Individual Card Search Bar
Some hero synergies are skewed due to a subset of decks going for a specific narrow theme that warps the rest of the deckbuilding process.
Consider such cards as "Strength in Diversity" or "Earth's Mightiest Heroes".
It would be nice to be able to filter for or against individual cards and the decks that run them.