v1.14.0
=======

2018-06-12T18:39:02Z

- Introduce `AsyncQueue`.
- `Point` is now more reliable when stringified to JSON.
- Fix a bug that `Point` mistakenly uses JS's `constructor` keyword.

v1.13.5
=======

2018-06-10T17:04:38Z

Fix a `web` bug that response with no "Content-Type" header will result in error on Node.js.

v1.13.4
=======

2018-05-21T23:38:30Z

Fix a bug of `sum`, `average` and `product` method of `Array` when the array is empty.

v1.13.3
=======

2018-05-17T21:41:28Z

Fix a bug in `IntervalTimer` when `skipsPast` is set to true.

v1.13.2
=======

2018-05-16T17:46:32Z

Fix a bug of `onMessage` event in `web.Socket`.

v1.13.1
=======

2018-05-15T15:01:57Z

Fix a bug in `web.Socket` constructor.

v1.13.0
=======

2018-05-15T14:35:40Z

Support relative URI in `web.Socket` constructor.

v1.12.0
=======

2018-05-12T08:35:00Z

- `web.request` now supports redirection.
- Add an experimental `web.Socket` class, but just for browser. In the future we'll make it run on Node.js.
- In the compilation process of this project, we use Babel 6 instead of Babel 5. Now only the ES imports and exports are converted by Babel. Others are not converted.

v1.11.0
=======

2017-08-22T15:40:22Z

- Add array's `asyncForEach`, `asyncMap`, `asyncSome`, `asyncEvery` methods.
- Add `eventField`'s `asyncFire` method.

v1.10.1
=======

2017-05-05T12:24:22Z

- `web` can parse UTF-16LE responses or responses with BOM in Node.js.

v1.10.0
=======

2017-04-04T06:14:30Z

- Add `holder` argument to event listener.

v1.9.1
======

2017-03-22T17:19:34Z

- Fix a bug that `web` errors are sometimes not turned into promise rejections.

v1.9.0
======

2016-09-28T09:16:08Z

- Implement array's insert methods.

v1.8.0
======

2016-09-25T10:43:38Z

- `approxEquals` now better handles numbers near zero.

v1.7.0
======

2016-09-16T06:16:12Z

- Now observers can force update the value.

v1.6.0
======

2016-08-14T17:03:13Z

- Now observers can manually check the value.

v1.5.0
======

2016-08-09T10:42:41Z

- Add some `Uint8Array` methods.
- Add a handy `bound` method for string, array, and `Uint8Array`.

v1.4.0
======

2016-08-08T13:50:24Z

Add `toString` method to `Uint8Array` instance, and `toBytes` method to `String` primitive.

v1.3.0
======

2016-07-15T13:37:43Z

Add `Promise..delay`.

v1.2.0
======

2016-07-06T07:05:47Z

Base64 encoding and decoding.

v1.1.3
======

2016-06-26T18:28:06Z

Clean README.

v1.1.2
======

2016-05-09T13:33:56Z

Fix a web bug.

v1.1.1
======

2016-04-18T10:34:07Z

Tweak manifest files.

v1.1.0
======

2016-04-16T01:37:04Z

Borrow features from Mate.

v1.0.0
======

2016-03-18T19:10:59Z

Add many functions. Rename `repeat` to `loop`.

v0.3.0
======

2016-02-29T19:53:24Z

Add `enum`.

v0.2.1
======

2016-01-23T14:03:41Z

Fix an example bug.

v0.2.0
======

2016-01-23T12:36:34Z

Add `web` and many other namespaces.

v0.1.0
======

2015-12-31T02:29:17Z

Initial release.
