## [1.0.0-beta.25](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.25...ngx-bang-v1.0.0-beta.25) (2022-01-21)

## [1.0.0-beta.24](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.23...ngx-bang-v1.0.0-beta.24) (2022-01-21)


### Bug Fixes

* **bang:** relax Snapshot type ([42c574f](https://github.com/nartc/nartc-workspace/commit/42c574feff078b8f534a8ad7a88188d75824e0dd))

## [1.0.0-beta.23](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.22...ngx-bang-v1.0.0-beta.23) (2022-01-21)


### Bug Fixes

* **bang:** use Snapshot type ([5c096b5](https://github.com/nartc/nartc-workspace/commit/5c096b5cc4a35d7dd1c7dde1c7c35dc5ba0b66a0))

## [1.0.0-beta.22](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.21...ngx-bang-v1.0.0-beta.22) (2022-01-21)


### Bug Fixes

* **bang:** AsRef type should not be a StateProxy ([257837c](https://github.com/nartc/nartc-workspace/commit/257837ce130d75ef0456857023114ca65b1099a0))

## [1.0.0-beta.21](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.20...ngx-bang-v1.0.0-beta.21) (2022-01-21)


### Bug Fixes

* **bang/async:** adjust the cleanUp fn for asyncEffect ([e13cea9](https://github.com/nartc/nartc-workspace/commit/e13cea97f6ff062642f728a81385257fc6184e15))

## [1.0.0-beta.20](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.19...ngx-bang-v1.0.0-beta.20) (2022-01-21)


### Features

* **bang/async:** adjust asyncEffect ([029e391](https://github.com/nartc/nartc-workspace/commit/029e391a25bb21d3acf1bd43cfd11d9d1a400c28))
* **bang:** expose CleanUpFn ([41bfd7a](https://github.com/nartc/nartc-workspace/commit/41bfd7aeeb8d48a4436c6d1251a8fe40b80c9561))

## [1.0.0-beta.19](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.18...ngx-bang-v1.0.0-beta.19) (2022-01-21)


### Features

* **bang:** expose destroy ([320cc25](https://github.com/nartc/nartc-workspace/commit/320cc25ca8986a42b0952e86c0c29588c54b79b2))

## [1.0.0-beta.18](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.17...ngx-bang-v1.0.0-beta.18) (2022-01-20)


### Bug Fixes

* **bang:** remove SnapshotPipe (unncesssary) ([fb52ca6](https://github.com/nartc/nartc-workspace/commit/fb52ca6d91bd43c4dd84d9a94e37973bca161474))


### Documentations

* **bang/async:** add jsdocs for asyncActions ([cbcdb79](https://github.com/nartc/nartc-workspace/commit/cbcdb790dffc505db319baf6040bcba69c050797))
* **bang:** add jsdocs and update readme ([7d24fab](https://github.com/nartc/nartc-workspace/commit/7d24fab57fbb0dfcbbfcd137abd9921d5bc3661c))

## [1.0.0-beta.17](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.16...ngx-bang-v1.0.0-beta.17) (2022-01-20)


### Bug Fixes

* **bang/async:** adjust asyncActions ([a8f62e5](https://github.com/nartc/nartc-workspace/commit/a8f62e5595942ae0144ee9b427bd6f2f2c372608))

## [1.0.0-beta.16](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.15...ngx-bang-v1.0.0-beta.16) (2022-01-20)


### Features

* **bang/async:** add AsyncActions ([84cd333](https://github.com/nartc/nartc-workspace/commit/84cd3339e50b4835099afc904ad4a48e5428a906))

## [1.0.0-beta.15](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.14...ngx-bang-v1.0.0-beta.15) (2022-01-20)


### Features

* **bang:** remove State altogether ([7f3f5ac](https://github.com/nartc/nartc-workspace/commit/7f3f5ac28900ecd4e5f951e9049ee3cf2616cace))

## [1.0.0-beta.14](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.13...ngx-bang-v1.0.0-beta.14) (2022-01-19)


### Features

* **bang:** add SnapshotPipe ([3eb272d](https://github.com/nartc/nartc-workspace/commit/3eb272d7fc92dc9c7bfee5e679a23b3c108fbfba))


### Bug Fixes

* **bang:** keep track of derives in a StateProxy for dispose ([83bc629](https://github.com/nartc/nartc-workspace/commit/83bc6294ce29d2c8121556108fc94eff06af0ea6))
* **bang:** remove derives input from StatefulDirective ([392c7cb](https://github.com/nartc/nartc-workspace/commit/392c7cbd7bd910766fdb82bc7a865c2de1d02e3f))
* **bang:** remove derives remnant from StatefulDirective ([ad5680b](https://github.com/nartc/nartc-workspace/commit/ad5680bb0444d9a1cb393baf9d7e409c295e8012))
* **bang:** set invalidate on derived based on the original StateProxy ([4bbe75d](https://github.com/nartc/nartc-workspace/commit/4bbe75dd5dc7996276fa9dffa83aa3478f29b40d))


### Documentations

* **bang:** add derive state to Counter example ([e7be09f](https://github.com/nartc/nartc-workspace/commit/e7be09fcdaa78343f9d1b4185f41a562b3754677))

## [1.0.0-beta.13](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.12...ngx-bang-v1.0.0-beta.13) (2022-01-19)


### Bug Fixes

* **bang:** adjust StateProxy typings and add documentations ([eaf38ae](https://github.com/nartc/nartc-workspace/commit/eaf38ae82517f12ca687e1037ba225fea64b6012))

## [1.0.0-beta.12](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.11...ngx-bang-v1.0.0-beta.12) (2022-01-19)


### Bug Fixes

* **bang:** force State to use stateful as well ([fe37dc6](https://github.com/nartc/nartc-workspace/commit/fe37dc62ee3fc0460a9417a891a2fe3fe5f669ec))

## [1.0.0-beta.11](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.10...ngx-bang-v1.0.0-beta.11) (2022-01-19)


### Bug Fixes

* **bang:** adjust typings for TDerived ([fa1a364](https://github.com/nartc/nartc-workspace/commit/fa1a36425ef5fec98305b4ea4e30d9e7f193c3ab))

## [1.0.0-beta.10](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.9...ngx-bang-v1.0.0-beta.10) (2022-01-19)


### Bug Fixes

* **bang:** revert to not using AppRef because it doesn't work as expecte ([25ac8fb](https://github.com/nartc/nartc-workspace/commit/25ac8fbff9d3242441336a40bb658ad56e61a6d3))

## [1.0.0-beta.9](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.8...ngx-bang-v1.0.0-beta.9) (2022-01-18)


### Bug Fixes

* **bang:** fix equality ([7089b5d](https://github.com/nartc/nartc-workspace/commit/7089b5db3b9591aab5b524a50b05bf2b4c6b8cc0))

## [1.0.0-beta.8](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.7...ngx-bang-v1.0.0-beta.8) (2022-01-18)


### Bug Fixes

* **bang:** attempt to pass down the invalidat eto child proxies ([126dd6d](https://github.com/nartc/nartc-workspace/commit/126dd6d54cc405cfc3eb12a4d9b9992d87987ee7))

## [1.0.0-beta.7](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.6...ngx-bang-v1.0.0-beta.7) (2022-01-18)


### Bug Fixes

* **bang:** use getVersion for child proxies ([0c3b104](https://github.com/nartc/nartc-workspace/commit/0c3b1045a7c9dfb671d0615dd95f074158c371fe))

## [1.0.0-beta.6](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.5...ngx-bang-v1.0.0-beta.6) (2022-01-18)


### Bug Fixes

* **bang:** attempt to fix how invalidate can be passed down to child proxies ([20e862b](https://github.com/nartc/nartc-workspace/commit/20e862b9a7f38e757438f114e66a07994297a08b))

## [1.0.0-beta.5](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.4...ngx-bang-v1.0.0-beta.5) (2022-01-18)


### Bug Fixes

* **bang:** use AppRef in place of ChangeDetectorRef for root services ([d9326a7](https://github.com/nartc/nartc-workspace/commit/d9326a75dbb794f5b33bcf89e4a64f8661be32fc))

## [1.0.0-beta.4](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.3...ngx-bang-v1.0.0-beta.4) (2022-01-18)


### Bug Fixes

* **bang:** expose logic to set invalidate via setInvalidate instead of just constructor ([38c0931](https://github.com/nartc/nartc-workspace/commit/38c09316915f71edda59dacb03be256b62b0acdc))

## [1.0.0-beta.3](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.2...ngx-bang-v1.0.0-beta.3) (2022-01-18)


### Bug Fixes

* **bang/async:** make successCallback for asyncEffect optional ([32bd304](https://github.com/nartc/nartc-workspace/commit/32bd30454de8197001b16a29cf1ccd3462452c22))

## [1.0.0-beta.2](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.1...ngx-bang-v1.0.0-beta.2) (2022-01-18)


### Features

* **bang/async:** add asyncEffect ([a7be2cb](https://github.com/nartc/nartc-workspace/commit/a7be2cb6581f911cf7180a3591446ab711298409))

## [1.0.0-beta.1](https://github.com/nartc/nartc-workspace/compare/ngx-bang-v1.0.0-beta.0...ngx-bang-v1.0.0-beta.1) (2022-01-18)


### Features

* **bang/async:** make connect aware of deps array ([f44f7c2](https://github.com/nartc/nartc-workspace/commit/f44f7c235c2c29901aa617e2b8227d5c2abdef67))


### Documentations

* **bang:** move ngx-bang-todo to ngx-bang-examples ([04767d4](https://github.com/nartc/nartc-workspace/commit/04767d4c5f972a9c4b8cc65a60a0272022780bc7))

## 1.0.0-beta.0 (2022-01-18)


### Features

* **bang:** init ([6ceaa42](https://github.com/nartc/nartc-workspace/commit/6ceaa42a2d938f19de0a1d37d25eaabc07967c92))
* **bang:** ready for beta ([80d6fc3](https://github.com/nartc/nartc-workspace/commit/80d6fc3477a7ea5e5416886aa152e5fbbdf40fdb))


### Documentations

* add [@nartc](https://github.com/nartc) as a contributor ([a269bcf](https://github.com/nartc/nartc-workspace/commit/a269bcf96a43fc98b442b1148c1781a6ad9167a4))
* **bang:** add README ([da28955](https://github.com/nartc/nartc-workspace/commit/da2895569526d94fe4b1bf2b3aa6085e8a0f0505))
* **bang:** add todo ([f31303d](https://github.com/nartc/nartc-workspace/commit/f31303d1aff3114a8420e6aeec9d36bc6dfa49c2))

