import decode/zero
import gleam/dynamic
import gleam/fetch
import gleam/http/request
import gleam/http/response.{Response}
import gleam/javascript/promise.{type Promise}
import gleam/list
import gleam/result

import glebs/crypto.{get_random_string, hash}

pub type Cat {
  Cat(id: String, url: String)
}

pub fn decode_cat(json: dynamic.Dynamic) -> Result(Cat, String) {
  let decoder = {
    use id <- zero.field("id", zero.string)
    use url <- zero.field("url", zero.string)
    zero.success(Cat(id:, url:))
  }

  zero.run(json, zero.list(decoder))
  |> result.map_error(fn(_) { "Error decoding cat" })
  |> result.map(fn(cats) {
    cats |> list.first |> result.replace_error("No cats in list")
  })
  |> result.flatten
}

pub fn get_cat_promise(_: a) -> Promise(Result(Cat, String)) {
  let _ = get_random_string(32)
  let _ = hash("test")
  let assert Ok(req) = request.to("https://api.thecatapi.com/v1/images/search")

  req
  |> fetch.send
  |> promise.try_await(fetch.read_json_body)
  |> promise.map(fn(res) {
    case res {
      Ok(Response(_, _, body)) -> decode_cat(body)
      _ -> Error("Error fetching cat")
    }
  })
  |> promise.rescue(fn(_) { Error("Error fetching cat") })
}
