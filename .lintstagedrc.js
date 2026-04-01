module.exports = {
  "*.{js,cjs,mjs,ts,tsx}": ["eslint --max-warnings=0 --fix --no-warn-ignored"],
  "*.{css,scss,json,md,html,yml}": ["prettier --write"],
};
