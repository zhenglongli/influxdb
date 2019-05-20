// Libraries
import React, {FunctionComponent} from 'react'
import {Config, Table} from '@influxdata/vis'
import {get} from 'lodash'

// Components
import EmptyGraphMessage from 'src/shared/components/EmptyGraphMessage'
import GraphLoadingDots from 'src/shared/components/GraphLoadingDots'

// Utils
import {useVisDomainSettings} from 'src/shared/utils/useVisDomainSettings'
import {getFormatter, chooseYColumn, chooseXColumn} from 'src/shared/utils/vis'

// Constants
import {VIS_THEME} from 'src/shared/constants'
import {DEFAULT_LINE_COLORS} from 'src/shared/constants/graphColorPalettes'
import {INVALID_DATA_COPY} from 'src/shared/copy/cell'

// Types
import {RemoteDataState, ScatterView} from 'src/types'

interface Props {
  table: Table
  groupKeyUnion: Array<string>
  loading: RemoteDataState
  viewProperties: ScatterView
  children: (config: Config) => JSX.Element
}

const ScatterContainer: FunctionComponent<Props> = ({
  table,
  groupKeyUnion,
  loading,
  children,
  viewProperties: {
    xAxisLabel,
    yAxisLabel,
    xPrefix,
    xSuffix,
    yPrefix,
    ySuffix,
    fillColumns: storedFill,
    symbolColumns: storedSymbol,
    colors,
    xDomain: storedXDomain,
    yDomain: storedYDomain,
  },
}) => {
  const fillColumns =
    storedFill && storedFill.length > 0 ? storedFill : groupKeyUnion
  const symbolColumns =
    storedSymbol && storedSymbol.length > 0 ? storedSymbol : groupKeyUnion

  // Eventually these will be configurable in the scatterGraph options UI
  const xColumn = chooseXColumn(table)
  const yColumn = chooseYColumn(table)

  const [xDomain, onSetXDomain, onResetXDomain] = useVisDomainSettings(
    storedXDomain,
    get(table, ['columns', xColumn, 'data'], [])
  )

  const [yDomain, onSetYDomain, onResetYDomain] = useVisDomainSettings(
    storedYDomain,
    get(table, ['columns', yColumn, 'data'], [])
  )

  const isValidView =
    xColumn &&
    table.columns[xColumn] &&
    yColumn &&
    table.columns[yColumn] &&
    fillColumns.every(col => !!table.columns[col]) &&
    symbolColumns.every(col => !!table.columns[col])

  if (!isValidView) {
    return <EmptyGraphMessage message={INVALID_DATA_COPY} />
  }

  const colorHexes =
    colors && colors.length
      ? colors.map(c => c.hex)
      : DEFAULT_LINE_COLORS.map(c => c.hex)

  const xFormatter = getFormatter(table.columns[xColumn].type, xPrefix, xSuffix)
  const yFormatter = getFormatter(table.columns[yColumn].type, yPrefix, ySuffix)

  const config: Config = {
    ...VIS_THEME,
    table,
    xAxisLabel,
    yAxisLabel,
    xDomain,
    onSetXDomain,
    onResetXDomain,
    yDomain,
    onSetYDomain,
    onResetYDomain,
    valueFormatters: {
      [xColumn]: xFormatter,
      [yColumn]: yFormatter,
    },
    layers: [
      {
        type: 'scatter',
        x: xColumn,
        y: yColumn,
        colors: colorHexes,
        fill: fillColumns,
        symbol: symbolColumns,
      },
    ],
  }
  return (
    <div className="vis-plot-container">
      {loading === RemoteDataState.Loading && <GraphLoadingDots />}
      {children(config)}
    </div>
  )
}

export default ScatterContainer