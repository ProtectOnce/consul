// app/helpers/add.js
import { helper } from '@ember/component/helper';

export function add([value, increment]) {
  return value + increment;
}

export default helper(add);
