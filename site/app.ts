import app from './docs-app'
import docMiddlewareApp from '../integration/doc-middleware/app'
import middlewareResponseApp from '../integration/middleware-response/app'
import nestedRouterApp from '../integration/nested-router/app'
import nestedRouterAdvancedApp from '../integration/nested-router-advanced/app'
import realWorldApp from '../integration/real-world-app/app'
import simpleRouterApp from '../integration/simple-router/app'
import withBasePathApp from '../integration/with-base-path/app'
import withValibotValidatorApp from '../integration/with-valibot-validator/app'
import withZodValidatorApp from '../integration/with-zod-validator/app'

app.route('/integration/simple-router', simpleRouterApp)
app.route('/integration/with-zod-validator', withZodValidatorApp)
app.route('/integration/with-valibot-validator', withValibotValidatorApp)
app.route('/integration/nested-router', nestedRouterApp)
app.route('/integration/nested-router-advanced', nestedRouterAdvancedApp)
app.route('/integration/with-base-path', withBasePathApp)
app.route('/integration/doc-middleware', docMiddlewareApp)
app.route('/integration/middleware-response', middlewareResponseApp)
app.route('/integration/real-world-app', realWorldApp)

export default app
