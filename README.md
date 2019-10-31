# gator-game
Large graphics project implemented with the [Gator](https://github.com/cucapra/linguine) language

## Installation

Use the package manager [npm](https://www.npmjs.com/package/npm) to install dependencies.

```bash
npm install
```

We are using a python simple server on port 1337. Run the command below and navigate to `localhost:1337`.

```bash
python3 -m http.server 1337
```

`linguine` is added as a git submodule, and it can be kept updated with its real repo by cd'ing into the linguine folder and using `git pull` (and then subsequently going into the parent gator-game directory and doing the standard git commit and git push to save this change). You can also change the linguine branch by navigating to the linguine folder and using `git checkout <branch>`