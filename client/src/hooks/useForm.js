import { useState } from "react";

const useForm = (initialValues, validate) => {
  const [values, setValues]   = useState(initialValues);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (touched[name] && validate) {
      const errs = validate({ ...values, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: errs[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (validate) {
      const errs = validate(values);
      setErrors((prev) => ({ ...prev, [name]: errs[name] }));
    }
  };

  const isValid = validate ? Object.keys(validate(values)).length === 0 : true;

  const reset = () => { setValues(initialValues); setErrors({}); setTouched({}); };

  return { values, errors, touched, handleChange, handleBlur, setValues, isValid, reset };
};

export default useForm;
