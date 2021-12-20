"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setsupervisor = exports.serviceLogic = void 0;
const servicetaskenvironment_1 = require("processhub-sdk/lib/servicetask/servicetaskenvironment");
const bpmnerror_1 = require("processhub-sdk/lib/instance/bpmnerror");
const bpmnprocess_1 = require("processhub-sdk/lib/process/bpmn/bpmnprocess");
const ErrorCodes = {
    API_ERROR: "API_ERROR",
    INPUT_ERROR: "INPUT_ERROR",
    SUPERVISOR_ERROR: "SUPERVISOR_ERROR",
    INSTANCE_ERROR: "INSTANCE_ERROR",
};
// Extract the serviceLogic that testing is possible
async function serviceLogic(environment) {
    const processObject = new bpmnprocess_1.BpmnProcess();
    await processObject.loadXml(environment.bpmnXml);
    const fields = await (0, servicetaskenvironment_1.getFields)(environment);
    const instance = environment.instanceDetails;
    // Get field names of the corresponding field ID's
    const selectedFieldUser = fields.find((f) => f.key === "userRoleId")?.value;
    const selectedFieldSupervisor = fields.find((f) => f.key === "supervisorRoleId")?.value;
    // Check the field inputs
    if (selectedFieldUser === undefined) {
        throw new bpmnerror_1.BpmnError(ErrorCodes.INPUT_ERROR, "Die Rolle des Mitarbeiters wurde nicht definiert!");
    }
    if (selectedFieldSupervisor === undefined) {
        throw new bpmnerror_1.BpmnError(ErrorCodes.INPUT_ERROR, "Die Rolle des Vorgesetzten wurde nicht definiert!");
    }
    // Get the laneId for selectedFieldUser
    const roleId = processObject.getLanes(false).find((l) => l.name === selectedFieldUser)?.id;
    if (!roleId) {
        throw new bpmnerror_1.BpmnError(ErrorCodes.API_ERROR, `Es konnte keine Rolle "${selectedFieldUser}" gefunden werden!`);
    }
    // Check if the selectedFieldUser role is assigned
    if (!(instance.extras.roleOwners && instance.extras.roleOwners[roleId] && instance.extras.roleOwners[roleId].length > 0)) {
        throw new bpmnerror_1.BpmnError(ErrorCodes.API_ERROR, `Es ist kein Benutzer der Rolle "${selectedFieldUser}" zugewiesen werden!`);
    }
    const userId = instance.extras.roleOwners[roleId][0].memberId;
    const supervisorId = await environment.roxApi.getSupervisor(userId);
    // Add supervisor and selected role to roleOwners
    if (typeof parseInt(supervisorId) === "number") {
        if (instance.extras.roleOwners[selectedFieldSupervisor] && instance.extras.roleOwners[selectedFieldSupervisor].length > 0) {
            instance.extras.roleOwners[selectedFieldSupervisor].push({ memberId: supervisorId });
            console.log(instance.extras.roleOwners);
        }
        else {
            instance.extras.roleOwners[selectedFieldSupervisor] = [{ memberId: supervisorId }];
            console.log(instance.extras.roleOwners);
        }
    }
    else if (supervisorId === "") {
        throw new bpmnerror_1.BpmnError(ErrorCodes.API_ERROR, "Der Vorgesetzte wurde nicht gefunden!");
    }
    else {
        throw new bpmnerror_1.BpmnError(ErrorCodes.SUPERVISOR_ERROR, "Gruppen werden als Vorgesetzte nicht unterstützt!");
    }
    return instance;
}
exports.serviceLogic = serviceLogic;
async function setsupervisor(environment) {
    await serviceLogic(environment);
    try {
        await environment.instances.updateInstance(environment.instanceDetails);
    }
    catch (error) {
        throw new bpmnerror_1.BpmnError(ErrorCodes.INSTANCE_ERROR, "Die Instanz konnte nicht aktualisiert werden!");
    }
    return true;
}
exports.setsupervisor = setsupervisor;
//# sourceMappingURL=setsupervisor-service.js.map