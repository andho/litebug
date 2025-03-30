import gleam/dict
import gleam/option
import gleam/result
import lustre/event

pub type FormEvent(field) {
  OnChange(field, String)
}

pub type InputField(field) {
  InputField(
    field: field,
    value: String,
    validate: fn(String) -> Result(String, String),
    error: option.Option(String),
  )
}

pub type Form(field) {
  Form(fields: dict.Dict(field, InputField(field)))
}

pub fn handle_form_event(
  form: Form(field),
  event: FormEvent(field),
) -> Form(field) {
  case event {
    OnChange(field, value) -> {
      case dict.get(form.fields, field) {
        Ok(input_field) -> {
          let error =
            input_field.validate(value)
            |> result.map_error(option.Some)
            |> result.unwrap_error(option.None)
          let new_input_field =
            InputField(..input_field, value: value, error: error)
          Form(fields: dict.insert(form.fields, field, new_input_field))
        }
        Error(_) -> form
      }
    }
  }
}

pub fn field_value(form: Form(field), field: field) {
  dict.get(form.fields, field)
  |> result.map(fn(input_field) { input_field.value })
  |> result.unwrap("")
}

pub fn field_error(form: Form(field), field: field) {
  dict.get(form.fields, field)
  |> result.map(fn(input_field) { input_field.error })
  |> option.from_result
  |> option.flatten
}

pub fn handle_on_change(msg: fn(FormEvent(field)) -> msg, field: field) {
  event.on_input(fn(val: String) { msg(OnChange(field, val)) })
}

pub fn init_field(field: field, validate: fn(String) -> Result(String, String)) {
  #(field, InputField(field, "", validate, error: option.None))
}

pub fn required(val: String) {
  case val {
    "" -> Error("Field is required")
    _ -> Ok(val)
  }
}
