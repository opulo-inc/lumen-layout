```bash
bundle main.js > bundle.js
```

Run `node bundle.js` then it should output:

```
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done=true, b.done=true
```
