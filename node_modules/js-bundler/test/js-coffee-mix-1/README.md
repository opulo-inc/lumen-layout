Run either of these two:

```bash
bundle -c:coffee 'node_modules/coffee-script/bin/coffee -bcs' -d 'coffee-script/register' qqq.js > bundle.js
bundle -c:coffee 'node_modules/coffee-script/bin/coffee -bcs' -d 'coffee-script/register' -i qqq.js > bundle.js
```

Run `node bundle.js` then any of these two should output:

```
in
sss
rrr
another-a
qqq
{ my: 3 }
```
