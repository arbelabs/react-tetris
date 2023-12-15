# react-tetris

## Usage

Step 1. Install dependencies

```shell
npm install
```

Step 2. Run the app on a local http server

```shell
npm run serve
```

Step 3. Watch for changes for real-time development

```shell
npm run watch
```

note: Most browsers will cache the exposed main.js file. If you make live changes to the code, you may need to clear your browser cache to see the changes. A simple way to do this is to open the developer tools and check the "Disable cache" checkbox in the "Network" tab.

## Task

Your goal is to change the rules of the game so that instead of clearing lines, you clear connected components of size at least 10.

A connected component is a set of same colored blocks that are connected to each other by their 4 edges.

For example, the following board has 5 connected components 2 of which are of size at least 10 and should have been cleared if the new rules were in place.

![Screenshot](example.png)

Good luck!
