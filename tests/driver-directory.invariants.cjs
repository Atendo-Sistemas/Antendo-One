const assert = require('node:assert/strict');
const fs = require('node:fs');

const api = fs.readFileSync('server/api.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const profile = fs.readFileSync('src/components/driver/DriverProfileView.tsx', 'utf8');
const directory = fs.readFileSync('src/components/drivers/DriverDirectoryPanel.tsx', 'utf8');
const registration = fs.readFileSync('src/components/common/PublicDriverRegistrationModal.tsx', 'utf8');
const showcase = fs.readFileSync('src/components/common/FreightShowcasePage.tsx', 'utf8');
const approvals = fs.readFileSync('src/components/drivers/DriverCompanyLinkPanel.tsx', 'utf8');
const manager = fs.readFileSync('src/components/drivers/DriverManager.tsx', 'utf8');
const companyDashboard = fs.readFileSync('src/components/company/CompanyDashboard.tsx', 'utf8');

assert.match(api, /publicPaths = \[[\s\S]*?'\/public\/drivers\/register'/, 'no-freight registration must be an intentional public OTP route');
assert.match(api, /apiRouter\.post\('\/public\/drivers\/register'[\s\S]*?termsAccepted[\s\S]*?privacyAccepted[\s\S]*?registrationPendingVerification = true[\s\S]*?directoryConsentPending/, 'registration must validate legal consent and defer directory visibility until phone verification');
assert.match(api, /const publicDriverRegistrationLimiter = rateLimit\(\{[\s\S]*?windowMs: PUBLIC_INTEREST_RATE_WINDOW_MS[\s\S]*?limit: 5/, 'public registration must throttle repeated requests from one connection');
assert.match(api, /apiRouter\.post\('\/public\/drivers\/register', publicDriverRegistrationLimiter,/, 'the registration route must apply the IP rate limiter');
assert.match(api, /const emailAtIndex = email\.indexOf\('@'\);[\s\S]*?email\.length <= 254[\s\S]*?emailAtIndex === email\.lastIndexOf\('@'\)/, 'public registration must validate email with bounded non-backtracking checks');
assert.match(api, /const publicDriverOtpVerificationLimiter = rateLimit\(\{[\s\S]*?limit: 10/, 'OTP verification must also throttle repeated requests from one connection');
assert.match(api, /apiRouter\.post\('\/auth\/verify-otp', publicDriverOtpVerificationLimiter,/, 'the OTP verification route must apply its IP rate limiter');
assert.match(api, /apiRouter\.get\('\/drivers\/directory'[\s\S]*?canManageTenantDirectory\(req\.user\)[\s\S]*?driver\.directoryVisible !== true[\s\S]*?companyLinkStatus/, 'directory must require company admins and return only opted-in profiles');
assert.match(api, /apiRouter\.post\('\/drivers\/directory\/:id\/request'[\s\S]*?req\.user\.tenantId[\s\S]*?scope: 'EMPRESA'/, 'company evaluation requests must be tenant-scoped');
assert.match(api, /if \(registeredDriver\?\.registrationPendingVerification\)[\s\S]*?driver\.directoryVisible = directoryConsent/, 'directory consent must be applied only after OTP verification');
assert.match(api, /if \(isSelfDriver && typeof body\.directoryVisible === 'boolean'/, 'only the driver may change directory visibility');
assert.match(api, /if \(driver && status === 'APROVADO' && !isCompanyDecision\)/, 'company decisions must not modify global driver status');
assert.match(api, /if \(driverUser && !isCompanyDecision\) void dispatchConfiguredNotification\('INTERESSE_FRETE'/, 'company evaluations must not send freight-interest notifications');
assert.match(app, /safeActiveTab === 'driver-directory'/, 'company app must render the directory tab');
assert.match(profile, /Permitir que empresas encontrem meu perfil/, 'drivers must be able to revoke directory visibility');
assert.match(directory, /Solicitar avaliação/, 'company directory must provide an evaluation request action');
assert.match(registration, /Cadastrar perfil de motorista/, 'public registration must not require freight');
assert.match(showcase, /Cadastrar como motorista/, 'public freight page must keep registration available without listings');
assert.match(companyDashboard, /totalFreights === 0[\s\S]*?Cadastrar motorista/, 'company admins must be able to open driver registration when there are no freights');
assert.match(approvals, /Não apto nesta empresa/, 'company decisions must be explicitly company-specific');
assert.match(manager, /id="driver-company-file-input" type="file"[\s\S]*?htmlFor="driver-company-file-input"[\s\S]*?Selecionar arquivo[\s\S]*?Máximo de 5 MB por arquivo/, 'driver edit modal must show an accessible attachment control with the per-file limit');
assert.match(manager, /file\.size > 5 \* 1024 \* 1024[\s\S]*?companyFileError/, 'oversized attachments must remain rejected with a visible error');

console.log('DRIVER_DIRECTORY_INVARIANTS_OK');
