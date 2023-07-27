# Compile

Before testing or publishing, it must be compiled to JS using:

```bash
rm -Rf target && rm -Rf test-target && fus lc lib target && npx babel --plugins=transform-es2015-modules-commonjs -d target target && fus lc test test-target && npx babel --plugins=transform-es2015-modules-commonjs -d test-target test-target
```

Before publishing write the changelog.

# Test

```bash
mocha test-target/main
```
