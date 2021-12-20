"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setsupervisorConfig = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Semantic = __importStar(require("semantic-ui-react"));
const PH = __importStar(require("processhub-sdk"));
function setsupervisorConfig() {
    return ((0, jsx_runtime_1.jsx)(Semantic.Modal.Content, { children: (0, jsx_runtime_1.jsx)("div", { id: "setsupervisor-form", className: "ui form center", children: (0, jsx_runtime_1.jsx)(Semantic.Table, { striped: true, children: (0, jsx_runtime_1.jsxs)(Semantic.Table.Body, { children: [(0, jsx_runtime_1.jsxs)(Semantic.Table.Row, { children: [(0, jsx_runtime_1.jsx)(Semantic.Table.Cell, { children: (0, jsx_runtime_1.jsx)(PH.TL, { text: "Rolle des Mitarbeiters" }, void 0) }, void 0), (0, jsx_runtime_1.jsx)(Semantic.Table.Cell, { children: (0, jsx_runtime_1.jsx)("input", { id: "userRoleId" }, void 0) }, void 0)] }, void 0), (0, jsx_runtime_1.jsxs)(Semantic.Table.Row, { children: [(0, jsx_runtime_1.jsx)(Semantic.Table.Cell, { children: (0, jsx_runtime_1.jsx)(PH.TL, { text: "Rolle des Vorgesetzten" }, void 0) }, void 0), (0, jsx_runtime_1.jsx)(Semantic.Table.Cell, { children: (0, jsx_runtime_1.jsx)("input", { id: "supervisorRoleId" }, void 0) }, void 0)] }, void 0)] }, void 0) }, void 0) }, void 0) }, void 0));
}
exports.setsupervisorConfig = setsupervisorConfig;
//# sourceMappingURL=setsupervisor-config.js.map