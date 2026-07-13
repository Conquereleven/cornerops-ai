const express = require('express');
const controller = require('../controllers/intelligenceController');
const { createControlTowerFrontendAuth } = require('../api/middleware/controlTowerFrontendAuth');
const { createControlTowerFrontendCors } = require('../api/middleware/controlTowerFrontendCors');
const { createControlTowerFrontendRateLimit } = require('../api/middleware/controlTowerFrontendRateLimit');
const { createControlTowerFrontendSanitizer } = require('../api/middleware/controlTowerFrontendSanitizer');
const { createControlTowerFounderActionAuth } = require('../api/middleware/controlTowerFounderActionAuth');

const router = express.Router();

router.use(
  createControlTowerFrontendCors(),
  createControlTowerFrontendAuth(),
  createControlTowerFrontendRateLimit(),
  createControlTowerFrontendSanitizer(),
);

router.get('/overview', controller.overview);
router.get('/control-tower-status', controller.controlTowerStatus);
router.get('/action-engine', controller.actionEngine);
const founderActionAuth = createControlTowerFounderActionAuth({
  recordAudit: controller.recordFounderActionAuthFailure,
});
router.post('/action-engine/drafts', founderActionAuth, controller.actionEngineDrafts);
router.get('/work-queue/status', controller.workQueueStatus);
router.get('/work-queue/audit', controller.listPersistentAudit);
router.get('/work-queue/drafts', controller.listPersistentDrafts);
router.get('/work-queue', controller.listWorkQueue);
router.get('/work-queue/:id', controller.getWorkItem);
router.post('/work-queue/sync', founderActionAuth, controller.syncWorkQueue);
router.patch('/work-queue/:id', founderActionAuth, controller.updateWorkItem);
router.get('/approvals', controller.listPersistentApprovals);
router.get('/approvals/:id', controller.getPersistentApproval);
router.post('/approvals/:id/approve', founderActionAuth, controller.approvePersistentApproval);
router.post('/approvals/:id/reject', founderActionAuth, controller.rejectPersistentApproval);
router.post('/approvals/:id/cancel', founderActionAuth, controller.cancelPersistentApproval);
router.get('/supplygraph/status', controller.supplyGraphStatus);
router.get('/supplygraph/suppliers', controller.listSupplyGraphSuppliers);
router.get('/supplygraph/suppliers/:id', controller.getSupplyGraphSupplier);
router.get('/supplygraph/authorized-sellers', controller.listAuthorizedSellers);
router.get('/supplygraph/authorized-sellers/:sellerKey', controller.getAuthorizedSeller);
router.get('/supplygraph/authorized-sellers/:sellerKey/onboarding-preview', controller.previewSellerOnboarding);
router.get('/supplygraph/seller-onboarding-packages', controller.listSellerOnboardingPackages);
router.get('/supplygraph/seller-onboarding-packages/:id', controller.getSellerOnboardingPackage);
router.get('/supplygraph/seller-onboarding-packages/:id/preview', controller.getSellerOnboardingPackage);
router.get('/supplygraph/seller-coverage', controller.listSellerCoverage);
router.get('/supplygraph/sellers/:id/catalog', controller.listAuthorizedSellerCatalog);
router.get('/supplygraph/sellers/:id/inventory', controller.listAuthorizedSellerInventory);
router.get('/supplygraph/sellers/:id/media-status', controller.listAuthorizedSellerMedia);
router.get('/supplygraph/seller-readiness', controller.getSellerReadiness);
router.get('/supplygraph/seller-catalog-gaps', controller.getSellerCatalogGaps);
router.get('/supplygraph/wave1-activation', controller.getWave1Activation);
router.get('/supplygraph/sellers/:id/catalog-health', controller.getSellerCatalogHealth);
router.get('/supplygraph/catalog/capture-summary', controller.getWave1CaptureSummary);
router.get('/supplygraph/media/coverage', controller.getSellerMediaCoverage);
router.get('/supplygraph/inventory/initialization-status', controller.getSellerInventoryInitializationStatus);
router.post('/supplygraph/wave1-activation/work-queue/sync', founderActionAuth, controller.syncWave1WorkQueue);
router.get('/supplygraph/products/:id', controller.getAuthorizedProduct);
router.get('/supplygraph/products/:id/inventory', controller.getAuthorizedProductInventory);
router.get('/supplygraph/products/:id/media', controller.getAuthorizedProductMedia);
router.get('/supplygraph/match-runs/:id/supplier-coverage', controller.getMatchSupplierCoverage);
router.get('/supplygraph/demand-requests/:id/supplier-coverage', controller.getDemandSupplierCoverage);
router.get('/supplygraph/catalog', controller.listSupplyGraphCatalog);
router.get('/supplygraph/catalog/:catalogItemId/evidence', controller.getSupplyGraphCatalogEvidence);
router.get('/supplygraph/suppliers/:supplierId/evidence-status', controller.getSupplyGraphSupplierEvidenceStatus);
router.get('/supplygraph/evidence-packages', controller.listSupplyGraphEvidencePackages);
router.get('/supplygraph/evidence-packages/:id', controller.getSupplyGraphEvidencePackage);
router.get('/supplygraph/evidence-packages/:id/preview', controller.previewSupplyGraphEvidencePackage);
router.get('/supplygraph/evidence-conflicts', controller.listSupplyGraphEvidenceConflicts);
router.get('/supplygraph/evidence-expiring', controller.listSupplyGraphEvidenceExpiring);
router.get('/supplygraph/demand-requests', controller.listSupplyGraphDemands);
router.get('/supplygraph/demand-requests/:id', controller.getSupplyGraphDemand);
router.get('/supplygraph/demand-requests/:id/match-runs', controller.listSupplyGraphDemandMatchRuns);
router.get('/supplygraph/demand-requests/:id/latest-match', controller.latestSupplyGraphDemandMatch);
router.get('/supplygraph/match-runs', controller.listSupplyGraphMatchRuns);
router.get('/supplygraph/match-runs/:id', controller.getSupplyGraphMatchRun);
router.post('/supplygraph/intermex/sync', founderActionAuth, controller.syncSupplyGraphIntermex);
router.post('/supplygraph/seller-onboarding-packages', founderActionAuth, controller.createSellerOnboardingPackageFromBody);
router.post('/supplygraph/seller-onboarding-packages/from-snapshot', founderActionAuth, controller.createSellerOnboardingPackageFromSnapshot);
router.post('/supplygraph/authorized-sellers/:sellerKey/onboarding-packages', founderActionAuth, controller.createSellerOnboardingPackage);
router.post('/supplygraph/seller-onboarding-packages/:id/apply', founderActionAuth, controller.applySellerOnboardingPackage);
router.post('/supplygraph/seller-onboarding-packages/:id/cancel', founderActionAuth, controller.cancelSellerOnboardingPackage);
router.post('/supplygraph/demand-requests', founderActionAuth, controller.createSupplyGraphDemand);
router.post('/supplygraph/evidence-packages', founderActionAuth, controller.createSupplyGraphEvidencePackage);
router.post('/supplygraph/evidence-packages/:id/apply', founderActionAuth, controller.applySupplyGraphEvidencePackage);
router.post('/supplygraph/evidence-packages/:id/cancel', founderActionAuth, controller.cancelSupplyGraphEvidencePackage);
router.post('/supplygraph/demand-requests/:id/match', founderActionAuth, controller.matchSupplyGraphDemand);
router.patch('/supplygraph/demand-requests/:id', founderActionAuth, controller.updateSupplyGraphDemand);
router.get('/product-activation', controller.productActivation);
router.get('/environment-doctor', controller.environmentDoctor);
router.get('/clients', controller.clients);
router.get('/signals', controller.signals);
router.get('/anomalies', controller.anomalies);
router.get('/cases', controller.cases);
router.get('/founder-review', controller.founderReview);
router.post('/cases/from-anomaly', founderActionAuth, controller.createCaseFromAnomaly);
router.patch('/cases/:id/status', founderActionAuth, controller.updateCaseStatus);
router.get('/playbooks', controller.playbooks);
router.get('/connectors', controller.connectors);

module.exports = router;
