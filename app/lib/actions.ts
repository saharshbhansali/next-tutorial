'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
 
const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
 
export async function createInvoice(formData: FormData) {

  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Test it out:
  const test = { customerId, amount, amountInCents, status, date };
  console.log(test);
  
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    console.log("Error: " + error);
    return {
      message: "Error inserting data into database",
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Use Zod to update the expected types
// const UpdateInvoice = InvoiceSchema.omit({date: true });
const UpdateInvoice = InvoiceSchema.omit({id:true, date: true });

export async function updateInvoice(uuid: string, formData: FormData) {

  const {customerId, amount, status } = UpdateInvoice.parse({
    // id: formData.get('id'),
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // console.log({id, customerId, amount, status})
  console.log({uuid, customerId, amount, status})

  const amountInCents = amount * 100;
  
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${uuid}
    `;
  } catch (error) {
    console.log("Error: " + error);
    return {
      message: "Error updating data in database",
    };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const DeleteInvoice = InvoiceSchema.omit({ date: true, id: true });
 
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    console.log("Error: " + error);
    return {
      message: "Error deleting data from database",
    };
  }
}