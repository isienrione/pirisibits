# LanePrior Ablation — Diagnostic Only

**Gate:** 2E.5-QA · **LanePrior NOT deleted**

Winner changes when LanePrior contribution = 0 (weights renormalized): **4 / 18**

| Fixture | before | after | changed | margin before | margin after | confidence | CLOSE_CALL? |
|---|---|---|---|---:|---:|---|---|
| F1 | SIGNATURE | DISCOVERY | true | 0.3 | 1.1 | CLOSE_CALL | true |
| F2 | SIGNATURE | SIGNATURE | false | 0.9 | 0.0 | CONSTRAINT_DOMINATED | false |
| F3 | SIGNATURE | DISCOVERY | true | 0.5 | 1.0 | CONSTRAINT_DOMINATED | false |
| F4 | SIGNATURE | SIGNATURE | false | 0.9 | 0.0 | CONSTRAINT_DOMINATED | false |
| F5 | DISCOVERY | DISCOVERY | false | 2.0 | 3.5 | CONSTRAINT_DOMINATED | false |
| F6 | DISCOVERY | DISCOVERY | false | 3.2 | 2.7 | MODERATE | false |
| F7 | DISCOVERY | DISCOVERY | false | 2.7 | 2.1 | MODERATE | false |
| F8 | DISCOVERY | DISCOVERY | false | 1.8 | 0.6 | CLOSE_CALL | true |
| F9 | DISCOVERY | DISCOVERY | false | 1.2 | 0.0 | CONSTRAINT_DOMINATED | false |
| F10 | SIGNATURE | SIGNATURE | false | 0.8 | 0.0 | CONSTRAINT_DOMINATED | false |
| F11 | DISCOVERY | SIGNATURE | true | 0.1 | 0.8 | CONSTRAINT_DOMINATED | false |
| F12 | DISCOVERY | DISCOVERY | false | 2.3 | 4.0 | CONSTRAINT_DOMINATED | false |
| F13 | SIGNATURE | SIGNATURE | false | 1.6 | 0.8 | CLOSE_CALL | true |
| F14 | DISCOVERY | SIGNATURE | true | 0.1 | 0.8 | CONSTRAINT_DOMINATED | false |
| F15 | FLOW | FLOW | false | 1.1 | 0.0 | CONSTRAINT_DOMINATED | false |
| F16 | DISCOVERY | DISCOVERY | false | 5.0 | 4.7 | MODERATE | false |
| F17 | SIGNATURE | SIGNATURE | false | 0.9 | 0.0 | CONSTRAINT_DOMINATED | false |
| F18 | SIGNATURE | SIGNATURE | false | 0.9 | 0.0 | CONSTRAINT_DOMINATED | false |
