import gleam/option
import glebs
import pages/config_page

pub type Model {
  Model(
    route: Route,
    oauth_config: glebs.OAuth2ClientConfig,
    token_response: option.Option(glebs.TokenResponse),
  )
}

pub type Route {
  HomePage
  LoginPage
  HandleOauthPage
  LogoutPage
  ConfigPage(glebs.OAuth2ClientConfig)
}

pub type Msg {
  RouteChanged(Route)
  Login
  LoggedInSuccessfully(glebs.TokenResponse)
  Logout
  LoggedOut
  ConfigPageMsg(config_page.ConfigMsg)
}
