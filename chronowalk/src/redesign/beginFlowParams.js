/** Query flag: Settings → Change or customize route opens the pace picker. */
export const BEGIN_CHOOSE_ROUTE_PARAM = 'chooseRoute'

export function beginChooseRoutePath() {
  return `/begin?${BEGIN_CHOOSE_ROUTE_PARAM}=1`
}
