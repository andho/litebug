import decode/zero
import gleam/dict
import gleam/dynamic
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/json
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import gleam/uri
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/event
import plinth/browser/window
import plinth/javascript/storage

import glebs
import glebs/request as glebs_request

import cats.{type Cat}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

pub type Model {
  Model(
    count: Int,
    cats: List(Cat),
    fetching: Bool,
    oauth_config: glebs.OAuth2ClientConfig,
    token_response: option.Option(glebs.TokenResponse),
  )
}

fn init(_) -> #(Model, effect.Effect(Msg)) {
  let config =
    glebs.OAuth2ClientConfig(
      client_id: "54",
      authorize_url: "https://firefly.andho.xyz/oauth/authorize",
      token_url: "https://firefly.andho.xyz/oauth/token",
      redirect_uri: "http://localhost:1234/oauth/handle",
      scope: "",
    )
  #(
    Model(0, [], False, config, option.None),
    effect.batch([load_token(), check_auth_code_handle(config)]),
  )
}

fn load_token() -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    let _ = {
      use local_storage <- result.try(storage.local())

      use token <- result.try(storage.get_item(local_storage, "auth_token"))

      io.debug(token)
      use token <- result.try(
        dynamic.from(token)
        |> zero.run(glebs_request.token_resp_decoder())
        |> result.map_error(fn(_error) { Nil }),
      )
      dispatch(LoggedInSuccessfully(token))
      Ok(Nil)
    }

    Nil
  })
}

pub type Msg {
  Login
  LoggedInSuccessfully(glebs.TokenResponse)
  Increment
  Decrement
  ApiReturnedCat(Result(Cat, String))
  FetchingCats
}

fn check_auth_code_handle(
  config: glebs.OAuth2ClientConfig,
) -> effect.Effect(Msg) {
  effect.from(fn(dispatch) {
    io.debug(#("location", window.location()))
    let a =
      window.location()
      |> uri.parse
      |> result.try(fn(current_uri) {
        case uri.path_segments(current_uri.path) {
          ["oauth", "handle"] -> {
            case current_uri.query {
              Some(query) -> uri.parse_query(query)
              None -> Error(Nil)
            }
          }
          _ -> Error(Nil)
        }
      })
      |> result.map(dict.from_list)
      |> result.try(dict.get(_, "code"))
      |> io.debug
      |> result.map(try_get_access_token(_, config, dispatch))

    Nil
  })
}

fn auth_token_to_json(token: glebs.TokenResponse) -> String {
  json.object([
    #("access_token", json.string(token.access_token)),
    #("token_type", json.string(token.token_type)),
    #("expires_in", json.string(int.to_string(token.expires_in))),
    #("refresh_token", json.string(token.refresh_token)),
  ])
  |> json.to_string
}

fn try_get_access_token(
  code: String,
  config: glebs.OAuth2ClientConfig,
  dispatch: fn(Msg) -> Nil,
) -> Nil {
  io.debug("Trying to get access token")
  let _ = {
    use local_storage <- result.try(storage.local())

    use verifier <- result.try(storage.get_item(local_storage, "glebs_verifier"))

    glebs_request.get_access_token(config, verifier, code)
    |> promise.map(fn(token) {
      case token {
        Ok(token) -> {
          io.debug(token)

          let _ =
            token
            |> auth_token_to_json
            |> storage.set_item(local_storage, "auth_token", _)

          dispatch(LoggedInSuccessfully(token))
          Ok(Nil)
        }
        Error(error) -> {
          io.debug(error)
          Ok(Nil)
        }
      }
    })
    |> promise.rescue(fn(_) {
      io.debug("Error getting access token")
      Ok(Nil)
    })
    |> promise.tap(fn(res) {
      case res {
        Error(e) -> {
          io.debug(e)
          Nil
        }
        _ -> Nil
      }
    })

    Ok(Nil)
  }

  Nil
}

fn login(config: glebs.OAuth2ClientConfig) -> effect.Effect(Msg) {
  effect.from(fn(_) {
    glebs_request.create_authorization_request_url(config)
    |> promise.map_try(fn(authorize_url) {
      let curr_window = window.self()

      let _ =
        storage.local()
        |> result.map(storage.set_item(_, "glebs_verifier", authorize_url.1))

      io.debug(authorize_url)
      let curr_window = window.self()
      window.set_location(curr_window, uri.to_string(authorize_url.0))

      Ok(Nil)
    })

    Nil
  })
}

fn redirect_to_home() -> effect.Effect(Msg) {
  let curr_window = window.self()
  window.set_location(curr_window, "/")
  effect.none()
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    Login -> #(model, login(model.oauth_config))
    LoggedInSuccessfully(token) -> #(
      Model(..model, token_response: Some(token)),
      redirect_to_home(),
    )
    Increment -> #(Model(..model, count: model.count + 1), get_cat())
    Decrement -> #(Model(..model, count: model.count - 1), effect.none())
    ApiReturnedCat(Ok(cat)) -> {
      io.debug(cat)
      #(
        Model(..model, cats: [cat, ..model.cats], fetching: False),
        effect.none(),
      )
    }
    ApiReturnedCat(Error(error)) -> {
      io.debug(error)
      #(Model(..model, fetching: False), effect.none())
    }
    FetchingCats -> #(Model(..model, fetching: True), effect.none())
  }
}

pub fn view(model: Model) -> element.Element(Msg) {
  let count = int.to_string(model.count)
  html.div([], [
    html.div([], [html.button([event.on_click(Login)], [element.text("Login")])]),
    html.button([event.on_click(Decrement)], [element.text("Decrement")]),
    html.text(count),
    html.button([event.on_click(Increment)], [element.text("Increment")]),
    {
      case model.fetching {
        True -> element.text("Fetching cats...")
        False -> element.none()
      }
    },
    element.keyed(
      html.div([], _),
      list.map(model.cats, fn(cat) {
        #(
          cat.id,
          html.img([
            attribute.src(cat.url),
            attribute.width(400),
            attribute.height(400),
          ]),
        )
      }),
    ),
  ])
}

pub fn get_cat() -> effect.Effect(Msg) {
  swr(Nil, cats.get_cat_promise, fn(result) {
    case result {
      FetchResult(data: option.Some(cat), ..) -> ApiReturnedCat(Ok(cat))
      FetchResult(_, option.Some(error), _) -> ApiReturnedCat(Error(error))
      FetchResult(_, _, True) -> FetchingCats
      _ -> ApiReturnedCat(Error("No cat"))
    }
  })
  //effect.from(fn(dispatch) {
  //  cats.get_cat_promise()
  //  |> promise.map(fn(cat) { ApiReturnedCat(cat) })
  //  |> promise.tap(dispatch)

  //  Nil
  //})
}

pub type FetchResult(data, error) {
  FetchResult(
    data: option.Option(data),
    error: option.Option(error),
    loading: Bool,
  )
}

pub fn swr(
  key: key,
  fetcher: fn(key) -> promise.Promise(Result(a, b)),
  wrap_effect: fn(FetchResult(a, b)) -> c,
) {
  effect.from(fn(dispatch) {
    FetchResult(data: option.None, error: option.None, loading: True)
    |> wrap_effect
    |> dispatch

    fetcher(key)
    |> promise.map(fn(p) {
      case p {
        Ok(data) ->
          FetchResult(
            data: option.Some(data),
            error: option.None,
            loading: False,
          )
        Error(error) ->
          FetchResult(
            data: option.None,
            error: option.Some(error),
            loading: False,
          )
      }
    })
    |> promise.map(wrap_effect)
    |> promise.tap(dispatch)

    Nil
  })
}

pub type FN(a, r) =
  fn(a) -> r

pub type FnKey(a, r) =
  #(FN(a, r), a)

fn key_fn(f: FnKey(a, r)) -> r {
  f.0(f.1)
}

fn fn_to_test(a: Int) -> String {
  int.to_string(a)
}

fn test_key_fn() {
  key_fn(#(fn_to_test, 1))
}
