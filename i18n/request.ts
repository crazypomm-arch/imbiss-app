import { getRequestConfig } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export default getRequestConfig(async () => {
  let locale = 'nl'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single()
      if (profile?.language) locale = profile.language
    }
  } catch {}

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
