import gleam/int
import gleam/result

pub fn required(next: fn(Result(String, String)) -> Result(a, String)) {
  fn(val: Result(String, String)) -> Result(a, String) {
    case val {
      Ok(val) -> {
        case val {
          "" -> Error("Field is required")
          _ -> next(Ok(val))
        }
      }
      Error(err) -> Error(err)
    }
  }
}

pub fn integer(next: fn(Result(Int, String)) -> Result(a, String)) {
  fn(val: Result(String, String)) -> Result(a, String) {
    case val {
      Ok(val) -> {
        case int.parse(val) {
          Ok(int_val) -> next(Ok(int_val))
          Error(_) -> Error("Field must be an integer")
        }
      }
      Error(err) -> Error(err)
    }
  }
}

pub fn to_msg(fun: fn(a) -> b) -> fn(Result(a, c)) -> Result(b, c) {
  result.map(_, fun)
}

pub fn process(
  next: fn(Result(String, String)) -> Result(msg, String),
  error_fn: fn(String) -> msg,
) -> fn(String) -> msg {
  fn(val: String) -> msg {
    case next(Ok(val)) {
      Ok(val) -> val
      Error(err) -> error_fn(err)
    }
  }
}
