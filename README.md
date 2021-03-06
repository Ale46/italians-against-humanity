## Italians Against Humanity [![gittip](https://img.shields.io/gittip/Ale46.svg)](https://www.gratipay.com/Ale46/)


NodeJS implementation of Cards Against Humanity, completely in italian language.
Take a look [HERE](http://italians-against-humanity.herokuapp.com)

## Modification
This work is derivated from the original project [nodejs-against-humanity](https://github.com/amirrajan/nodejs-against-humanity), with few changes:


- All the cards are in italian language
- Three choice black cards and spectate mode (partial code from [this fork](https://github.com/pdrasko/nodejs-against-humanity)) 
- Form to choice nickname with cookie support
- Dirty (on code side) extensions support
- Form where you can define game options (points to win, min player, max players, extensions to use)
- Wait time between rounds
- Ingame chat
- Small fixes and tweaks

## Run Locally

Install all the dependencies:

    npm install #(you may need to prefix this with sudo if you're on Mac)

Run the app:

    node server.js

Then navigate to `http://localhost:3000`


If you want the server to load up everytime you change the back end:

    npm install -g nodemon

Then run the following instead of `node server.js`:

    nodemon server.js
	
## Known Bugs
- If a player leaves bad things happens.

## Italian text cards credits
[https://git.eigenlab.org/ilario/cards-against-humanity-italian-translation](https://git.eigenlab.org/ilario/cards-against-humanity-italian-translation)


<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/2.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc-sa/2.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/2.0/">Creative Commons Attribution-NonCommercial-ShareAlike 2.0 Generic License</a>.
