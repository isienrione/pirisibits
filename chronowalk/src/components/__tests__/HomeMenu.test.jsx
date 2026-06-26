import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import HomeMenu from '../HomeMenu'

const stops = [
  { id: 'colosseum', title: 'Colosseum', status: 'completed' },
  { id: 'pantheon', title: 'The Pantheon', status: 'current' },
]

describe('HomeMenu', () => {
  it('lists locations and calls jump handler', () => {
    const onJumpToStop = vi.fn()

    render(
      <HomeMenu
        open
        onClose={() => {}}
        side="left"
        tour={{ title: 'Heart of Ancient Rome' }}
        stops={stops}
        onJumpToStop={onJumpToStop}
        showScript={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /the pantheon/i }))
    expect(onJumpToStop).toHaveBeenCalledWith('pantheon')
  })
})
