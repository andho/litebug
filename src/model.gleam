import gleam/option
import glebs
import pages/config_page
import pages/home_page

pub type Model {
  Model(
    route: Route,
    oauth_config: option.Option(glebs.OAuth2ClientConfig),
    token_response: option.Option(glebs.TokenResponse),
  )
}

pub type Route {
  HomePage(home_page.Model)
  LoginPage
  HandleOauthPage
  ConfigPage(config_page.ConfigModel)
}

pub type Msg {
  RouteChanged(Route)
  Login
  LoggedInSuccessfully(glebs.TokenResponse)
  Logout
  LoggedOut
  ConfigPageMsg(config_page.ConfigMsg)
  HomePageMsg(home_page.Msg)
}
