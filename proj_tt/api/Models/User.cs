using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class User
    {

        [Key]
        public int UserID { get; set; }
        public string UserEmail { get; set; }
        public string UserIconPath { get; set; }
        public string UserName { get; set; }
        public string UserPassword { get; set; }
    }
}
